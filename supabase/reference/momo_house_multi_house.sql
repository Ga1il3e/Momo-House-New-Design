-- =============================================================================
-- Momo House — multi-house schema (reference migration)
-- Two houses (montmartre, poissonniere), one Supabase project, strict per-house
-- isolation enforced by RLS. Same interface and logic, separate data.
--
-- Idempotent and additive: safe to run on the existing qhwmjyzzeggyoktdmqtt
-- schema (tables, reservations, settings, house_ops, site_settings,
-- contact_messages, admin views, private RPCs) and safe to run twice.
-- Target: Supabase Postgres 15+.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions and schemas
-- -----------------------------------------------------------------------------
create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto  with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 1. Enums (contract enums are kept as-is; new enums are created once)
-- -----------------------------------------------------------------------------
do $$
declare
  e record;
begin
  for e in
    select * from (values
      ('house_id',               array['montmartre','poissonniere']),
      ('table_zone',             array['salle','terrasse']),
      ('reservation_status',     array['held','released','blocked','confirmed','cancelled','no_show']),
      ('staff_role',             array['staff','owner']),
      ('closure_scope',          array['all','reservations','orders']),
      ('order_status',           array['pending','confirmed','preparing','ready','completed','cancelled']),
      ('fulfillment_type',       array['pickup','delivery']),
      ('payment_method',         array['card','cash']),
      ('payment_status',         array['pending','paid','failed','refunded','partially_refunded']),
      ('checkout_intent_status', array['pending','completed','failed','abandoned','expired']),
      ('email_status',           array['queued','sent','failed','skipped'])
    ) as t(name, vals)
  loop
    if not exists (
      select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = e.name
    ) then
      execute format('create type public.%I as enum (%s)', e.name,
        (select string_agg(quote_literal(v), ',') from unnest(e.vals) v));
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Generic trigger functions
-- -----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- A row can never move from one house to the other.
create or replace function private.forbid_house_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.house is distinct from old.house then
    raise exception 'house_immutable' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Staff identity (source of truth for every RLS decision)
-- -----------------------------------------------------------------------------
create table if not exists public.staff_members (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  role         public.staff_role not null default 'staff',
  house        public.house_id,
  display_name text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint staff_members_role_house check (
    (role = 'owner' and house is null) or (role = 'staff' and house is not null)
  )
);
alter table public.staff_members enable row level security;

create or replace function private.is_service_role()
returns boolean language sql stable set search_path = '' as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role'
      or coalesce(current_setting('role', true), '') = 'service_role';
$$;

create or replace function private.current_staff_role()
returns public.staff_role language sql stable security definer set search_path = '' as $$
  select s.role from public.staff_members s where s.user_id = auth.uid() and s.active;
$$;

create or replace function private.current_staff_house()
returns public.house_id language sql stable security definer set search_path = '' as $$
  select s.house from public.staff_members s where s.user_id = auth.uid() and s.active;
$$;

create or replace function private.is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select s.role = 'owner' from public.staff_members s
                   where s.user_id = auth.uid() and s.active), false);
$$;

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_members s where s.user_id = auth.uid() and s.active);
$$;

create or replace function private.can_access_house(p_house public.house_id)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.staff_members s
    where s.user_id = auth.uid() and s.active
      and (s.role = 'owner' or s.house = p_house)
  );
$$;

-- Mirror staff_members into auth.users.raw_app_meta_data so proxy.ts can route
-- from getClaims() without a DB round-trip. The DB never trusts the JWT copy.
create or replace function private.sync_staff_claims()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    update auth.users
       set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role' - 'house'
     where id = old.user_id;
    return old;
  end if;
  update auth.users
     set raw_app_meta_data = (coalesce(raw_app_meta_data, '{}'::jsonb) - 'role' - 'house')
         || jsonb_build_object('role', case when new.active then new.role::text else 'disabled' end)
         || case when new.house is null then '{}'::jsonb else jsonb_build_object('house', new.house::text) end
   where id = new.user_id;
  return new;
end $$;

drop trigger if exists staff_members_sync_claims on public.staff_members;
create trigger staff_members_sync_claims
  after insert or update or delete on public.staff_members
  for each row execute function private.sync_staff_claims();

drop trigger if exists staff_members_updated_at on public.staff_members;
create trigger staff_members_updated_at before update on public.staff_members
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. House configuration
-- -----------------------------------------------------------------------------
create table if not exists public.house_ops (
  house        public.house_id primary key,
  phone        text,
  phone_href   text,
  hours_label  text,
  hours_note   text,
  lunch_open   time,
  lunch_close  time,
  dinner_open  time,
  dinner_close time,
  continuous   boolean not null default false
);
alter table public.house_ops add column if not exists display_name    text;
alter table public.house_ops add column if not exists address_line    text;
alter table public.house_ops add column if not exists postal_code     text;
alter table public.house_ops add column if not exists city            text default 'Paris';
alter table public.house_ops add column if not exists contact_email   text;
alter table public.house_ops add column if not exists email_from_name text;
alter table public.house_ops add column if not exists closed_weekdays smallint[] not null default '{}'; -- ISO 1=Mon … 7=Sun
alter table public.house_ops add column if not exists updated_at      timestamptz not null default now();
alter table public.house_ops enable row level security;

create table if not exists public.site_settings (
  id            boolean primary key default true check (id),
  contact_email text
);
alter table public.site_settings add column if not exists updated_at timestamptz not null default now();
alter table public.site_settings enable row level security;

create table if not exists public.settings (
  house               public.house_id primary key,
  hold_minutes        integer not null default 90,
  guest_email_subject text,
  guest_email_body    text,
  house_email_subject text,
  house_email_body    text,
  notify_email        text,
  time_slots          text[] not null default '{}'
);
alter table public.settings add column if not exists reservations_enabled   boolean not null default true;
alter table public.settings add column if not exists max_party_size         integer not null default 12;
alter table public.settings add column if not exists min_lead_minutes       integer not null default 60;
alter table public.settings add column if not exists booking_horizon_days   integer not null default 60;
alter table public.settings add column if not exists confirm_email_subject  text;
alter table public.settings add column if not exists confirm_email_body     text;
alter table public.settings add column if not exists cancel_email_subject   text;
alter table public.settings add column if not exists cancel_email_body      text;
alter table public.settings add column if not exists updated_at             timestamptz not null default now();
alter table public.settings enable row level security;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'settings_hold_minutes_min') then
    alter table public.settings add constraint settings_hold_minutes_min
      check (hold_minutes between 15 and 360) not valid;
  end if;
end $$;

create table if not exists public.house_closures (
  id         uuid primary key default gen_random_uuid(),
  house      public.house_id not null,
  starts_on  date not null,
  ends_on    date not null,
  scope      public.closure_scope not null default 'all',
  reason     text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  constraint house_closures_dates check (ends_on >= starts_on)
);
create index if not exists house_closures_house_dates_idx on public.house_closures (house, starts_on, ends_on);
alter table public.house_closures enable row level security;

-- -----------------------------------------------------------------------------
-- 5. Floor plan and reservations (contract names unchanged)
-- -----------------------------------------------------------------------------
create table if not exists public.tables (
  id         uuid primary key default gen_random_uuid(),
  house      public.house_id not null,
  zone       public.table_zone not null,
  number     integer not null,
  seats      integer not null default 2,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (house, zone, number)
);
alter table public.tables add column if not exists sort_order integer not null default 0;
alter table public.tables add column if not exists updated_at timestamptz not null default now();
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'tables_id_house_key') then
    alter table public.tables add constraint tables_id_house_key unique (id, house);
  end if;
end $$;
alter table public.tables enable row level security;

create table if not exists public.reservations (
  id           uuid primary key default gen_random_uuid(),
  house        public.house_id not null,
  table_id     uuid not null references public.tables(id),
  service_date date not null,
  start_time   time not null,
  hold_minutes integer not null default 90,
  guest_name   text,
  guest_phone  text,
  guest_email  text,
  note         text,
  guests       integer not null default 2,
  status       public.reservation_status not null default 'held',
  created_at   timestamptz not null default now()
);
alter table public.reservations add column if not exists source        text not null default 'web';
alter table public.reservations add column if not exists created_by    uuid;
alter table public.reservations add column if not exists confirmed_at  timestamptz;
alter table public.reservations add column if not exists confirmed_by  uuid;
alter table public.reservations add column if not exists cancelled_at  timestamptz;
alter table public.reservations add column if not exists cancel_token  uuid not null default gen_random_uuid();
alter table public.reservations add column if not exists updated_at    timestamptz not null default now();
alter table public.reservations add column if not exists deleted_at    timestamptz;
alter table public.reservations add column if not exists slot tsrange
  generated always as (
    tsrange(service_date + start_time,
            service_date + start_time + make_interval(mins => hold_minutes), '[)')
  ) stored;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'reservations_table_same_house_fkey') then
    alter table public.reservations add constraint reservations_table_same_house_fkey
      foreign key (table_id, house) references public.tables (id, house);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reservations_source_check') then
    alter table public.reservations add constraint reservations_source_check
      check (source in ('web','staff','phone')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reservations_hold_minutes_check') then
    alter table public.reservations add constraint reservations_hold_minutes_check
      check (hold_minutes between 15 and 360) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reservations_guests_check') then
    alter table public.reservations add constraint reservations_guests_check
      check (guests between 0 and 50) not valid;
  end if;
  -- Occupancy [start, start + hold_minutes): held, blocked and confirmed block the table.
  if not exists (select 1 from pg_constraint where conname = 'reservations_no_overlap') then
    alter table public.reservations add constraint reservations_no_overlap
      exclude using gist (table_id with =, slot with &&)
      where (status in ('held','blocked','confirmed') and deleted_at is null);
  end if;
end $$;

create index if not exists reservations_house_date_idx on public.reservations (house, service_date, start_time);
create index if not exists reservations_house_status_idx on public.reservations (house, status) where deleted_at is null;
create unique index if not exists reservations_cancel_token_uidx on public.reservations (cancel_token);
alter table public.reservations enable row level security;

-- -----------------------------------------------------------------------------
-- 6. Contact messages
-- -----------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  house      public.house_id not null,
  name       text not null,
  email      text not null,
  phone      text,
  subject    text,
  message    text not null,
  status     text not null default 'new' check (status in ('new','read','archived')),
  created_at timestamptz not null default now()
);
alter table public.contact_messages add column if not exists handled_by uuid;
alter table public.contact_messages add column if not exists updated_at timestamptz not null default now();
alter table public.contact_messages add column if not exists deleted_at timestamptz;
create index if not exists contact_messages_house_idx on public.contact_messages (house, created_at desc);
alter table public.contact_messages enable row level security;

-- -----------------------------------------------------------------------------
-- 7. Menu (one menu per house; categories are canonical per house)
-- -----------------------------------------------------------------------------
create table if not exists public.menu_categories (
  id            uuid primary key default gen_random_uuid(),
  house         public.house_id not null,
  name          text not null,
  name_alt      text,                        -- Devanagari / Nepali label shown under the French one
  slug          text not null,
  display_order integer not null default 0,
  is_active     boolean not null default true,
  is_drinks     boolean not null default false, -- excluded from the takeaway discount
  orderable     boolean not null default true,  -- false = shown on the menu, not orderable online
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint menu_categories_house_slug_key unique (house, slug),
  constraint menu_categories_house_name_key unique (house, name),
  constraint menu_categories_id_house_key   unique (id, house),
  constraint menu_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
alter table public.menu_categories enable row level security;

create table if not exists public.dishes (
  id            uuid primary key default gen_random_uuid(),
  house         public.house_id not null,
  category_id   uuid not null,
  name          text not null,
  name_alt      text,
  description   text,
  price_cents   integer not null check (price_cents >= 0),
  image_path    text,          -- storage object path: {house}/dishes/{uuid}.webp
  image_url     text,          -- public URL of image_path
  available     boolean not null default true,  -- today (sold out = false)
  orderable     boolean not null default true,  -- can be ordered online at all
  featured      boolean not null default false, -- "Nos incontournables" on the house page
  tags          text[] not null default '{}',
  allergens     text[] not null default '{}',
  spice_level   smallint not null default 0 check (spice_level between 0 and 3),
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint dishes_id_house_key unique (id, house),
  constraint dishes_category_same_house_fkey foreign key (category_id, house)
    references public.menu_categories (id, house) on delete restrict,
  constraint dishes_tags_check check (tags <@ array['vegetarien','vegan','halal','sans-gluten','fait-maison','signature']::text[]),
  constraint dishes_allergens_check check (allergens <@ array[
    'gluten','crustaces','oeufs','poissons','arachides','soja','lait','fruits-a-coque',
    'celeri','moutarde','sesame','sulfites','lupin','mollusques']::text[])
);
create index if not exists dishes_house_category_idx on public.dishes (house, category_id, display_order);
alter table public.dishes enable row level security;

-- -----------------------------------------------------------------------------
-- 8. Online ordering (per house; each house has its own Stripe account)
-- -----------------------------------------------------------------------------
create table if not exists public.ordering_settings (
  house                          public.house_id primary key,
  takeaway_enabled               boolean not null default false,
  delivery_enabled               boolean not null default false,
  cash_on_pickup_enabled         boolean not null default true,
  takeaway_fee_cents             integer not null default 0  check (takeaway_fee_cents >= 0),
  takeaway_discount_pct          numeric(5,2) not null default 0 check (takeaway_discount_pct between 0 and 50),
  prep_minutes                   integer not null default 20 check (prep_minutes between 5 and 180),
  delivery_fee_cents             integer not null default 0  check (delivery_fee_cents >= 0),
  delivery_min_cents             integer not null default 2000 check (delivery_min_cents >= 0),
  delivery_postcodes             text[]  not null default '{}',   -- empty = any postcode (indicative)
  delivery_eta_minutes           integer not null default 45 check (delivery_eta_minutes between 10 and 180),
  last_order_minutes_before_close integer not null default 15 check (last_order_minutes_before_close between 0 and 120),
  paused_until                   timestamptz,                      -- "Pause 30 min" rush button
  updated_at                     timestamptz not null default now(),
  updated_by                     uuid
);
alter table public.ordering_settings enable row level security;

create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  house                public.house_id not null,
  order_number         text not null,
  status               public.order_status not null default 'pending',
  fulfillment          public.fulfillment_type not null,
  customer_name        text not null,
  customer_phone       text not null,
  customer_email       text not null,
  delivery_address     jsonb,           -- {line1, line2, postcode, city, instructions}
  requested_time       timestamptz,     -- null = dès que possible
  subtotal_cents       integer not null check (subtotal_cents >= 0),
  discount_cents       integer not null default 0 check (discount_cents >= 0),
  fee_cents            integer not null default 0 check (fee_cents >= 0),
  total_cents          integer not null check (total_cents >= 0),
  payment_method       public.payment_method not null,
  payment_status       public.payment_status not null default 'pending',
  payment_intent_id    text,
  stripe_payment_label text,
  refunded_cents       integer not null default 0 check (refunded_cents >= 0),
  paid_at              timestamptz,
  needs_review         boolean not null default false,  -- set when the paid amount does not match the quote
  customer_note        text,
  internal_note        text,
  cancel_token         uuid not null default gen_random_uuid(),
  cancel_reason        text,
  cancelled_by         text check (cancelled_by in ('guest','staff')),
  confirmed_at         timestamptz,
  ready_at             timestamptz,
  completed_at         timestamptz,
  cancelled_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  constraint orders_house_number_key unique (house, order_number),
  constraint orders_id_house_key     unique (id, house),
  constraint orders_total_check      check (total_cents = subtotal_cents - discount_cents + fee_cents),
  constraint orders_delivery_address check (fulfillment = 'pickup' or delivery_address is not null),
  constraint orders_no_cash_delivery check (not (fulfillment = 'delivery' and payment_method = 'cash')),
  constraint orders_card_has_intent  check (payment_method = 'cash' or payment_intent_id is not null)
);
create unique index if not exists orders_payment_intent_uidx on public.orders (payment_intent_id) where payment_intent_id is not null;
create unique index if not exists orders_cancel_token_uidx on public.orders (cancel_token);
create index if not exists orders_house_created_idx on public.orders (house, created_at desc);
create index if not exists orders_house_active_idx on public.orders (house, status) where deleted_at is null;
alter table public.orders enable row level security;

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null,
  house            public.house_id not null,
  dish_id          uuid,
  dish_name        text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity         integer not null check (quantity between 1 and 50),
  line_total_cents integer not null,
  notes            text,
  constraint order_items_order_same_house_fkey foreign key (order_id, house)
    references public.orders (id, house) on delete cascade,
  constraint order_items_dish_same_house_fkey foreign key (dish_id, house)
    references public.dishes (id, house) on delete set null (dish_id),
  constraint order_items_line_total check (line_total_cents = unit_price_cents * quantity)
);
create index if not exists order_items_order_idx on public.order_items (order_id);
alter table public.order_items enable row level security;

-- Private snapshot of a card checkout. No orders row exists until Stripe says succeeded.
create table if not exists public.checkout_intents (
  id                uuid primary key default gen_random_uuid(),
  house             public.house_id not null,
  payment_intent_id text not null unique,
  quote             jsonb not null,   -- output of checkout_quote()
  customer          jsonb not null,   -- {name, phone, email, delivery_address, requested_time, note}
  amount_cents      integer not null check (amount_cents >= 50),
  currency          text not null default 'eur',
  status            public.checkout_intent_status not null default 'pending',
  order_id          uuid references public.orders(id) on delete set null,
  last_error        text,
  expires_at        timestamptz not null default now() + interval '1 day',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.checkout_intents enable row level security;
revoke all on public.checkout_intents from anon, authenticated;

create table if not exists private.house_counters (
  house public.house_id not null,
  kind  text not null,
  day   date not null,
  value integer not null default 0,
  primary key (house, kind, day)
);

create or replace function private.next_order_number(p_house public.house_id)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_day date := (now() at time zone 'Europe/Paris')::date;
  v_val integer;
begin
  insert into private.house_counters as c (house, kind, day, value)
  values (p_house, 'order', v_day, 1)
  on conflict (house, kind, day) do update set value = c.value + 1
  returning value into v_val;
  return case p_house when 'montmartre' then 'M' else 'P' end
         || to_char(v_day, 'YYMMDD') || '-' || lpad(v_val::text, 3, '0');
end $$;

create or replace function private.orders_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := private.next_order_number(new.house);
  end if;
  if new.payment_status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  return new;
end $$;

drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert before insert on public.orders
  for each row execute function private.orders_before_insert();

create or replace function private.order_status_rank(p public.order_status)
returns integer language sql immutable set search_path = '' as $$
  select case p when 'pending' then 0 when 'confirmed' then 1 when 'preparing' then 2
                when 'ready' then 3 when 'completed' then 4 when 'cancelled' then 5 end;
$$;

-- Staff can only move orders forward, cannot un-cancel, cannot touch card
-- payment state (refunds go through the server with the house Stripe key).
create or replace function private.orders_before_update()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_service boolean := private.is_service_role();
begin
  if new.status is distinct from old.status then
    if not v_service then
      if old.status in ('completed','cancelled') then
        raise exception 'invalid_status_transition' using errcode = 'P0001';
      end if;
      if new.status <> 'cancelled'
         and private.order_status_rank(new.status) < private.order_status_rank(old.status) then
        raise exception 'invalid_status_transition' using errcode = 'P0001';
      end if;
      if new.status = 'cancelled' and old.payment_method = 'card' and old.payment_status = 'paid' then
        raise exception 'refund_required' using errcode = 'P0001';
      end if;
    end if;
    case new.status
      when 'confirmed' then new.confirmed_at := coalesce(new.confirmed_at, now());
      when 'ready'     then new.ready_at     := coalesce(new.ready_at, now());
      when 'completed' then new.completed_at := coalesce(new.completed_at, now());
      when 'cancelled' then new.cancelled_at := coalesce(new.cancelled_at, now());
                            new.cancelled_by := coalesce(new.cancelled_by, 'staff');
      else null;
    end case;
  end if;

  if new.payment_status is distinct from old.payment_status then
    if not v_service and not (
         old.payment_method = 'cash'
         and ((old.payment_status = 'pending' and new.payment_status = 'paid')
           or (old.payment_status = 'paid' and new.payment_status = 'pending'))) then
      raise exception 'payment_status_locked' using errcode = 'P0001';
    end if;
    new.paid_at := case when new.payment_status = 'paid' then coalesce(new.paid_at, now()) else null end;
  end if;
  return new;
end $$;

drop trigger if exists orders_before_update on public.orders;
create trigger orders_before_update before update on public.orders
  for each row execute function private.orders_before_update();

-- -----------------------------------------------------------------------------
-- 9. Email journal, event banners, activity log
-- -----------------------------------------------------------------------------
create table if not exists public.email_logs (
  id          uuid primary key default gen_random_uuid(),
  house       public.house_id not null,
  type        text not null,
  to_email    text not null,
  subject     text,
  status      public.email_status not null default 'queued',
  provider_id text,
  error       text,
  entity_type text check (entity_type in ('reservation','order','contact_message','other')),
  entity_id   uuid,
  html        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
-- One live send per (entity, type, recipient): webhook + confirm races never double-mail.
create unique index if not exists email_logs_idempotency_uidx
  on public.email_logs (entity_id, type, to_email)
  where entity_id is not null and status in ('queued','sent','skipped');
create index if not exists email_logs_house_created_idx on public.email_logs (house, created_at desc);
alter table public.email_logs enable row level security;

create table if not exists public.event_banners (
  id            uuid primary key default gen_random_uuid(),
  house         public.house_id not null,
  title         text,
  body          text,
  link_url      text check (link_url is null or link_url ~* '^https?://'),
  image_path    text not null,   -- {house}/banners/{uuid}.webp in bucket event-banners
  image_url     text not null,
  starts_on     date not null,
  ends_on       date not null,
  enabled       boolean not null default true,
  show_on_home  boolean not null default true,  -- also shown on the shared homepage
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint event_banners_dates check (ends_on >= starts_on)
);
create index if not exists event_banners_house_dates_idx on public.event_banners (house, starts_on, ends_on);
alter table public.event_banners enable row level security;

create table if not exists public.activity_log (
  id          bigint generated always as identity primary key,
  house       public.house_id not null,
  actor       uuid,            -- null = guest / system (service role)
  action      text not null,   -- e.g. reservations.status.confirmed
  entity_type text not null,
  entity_id   uuid,
  meta        jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists activity_log_entity_idx on public.activity_log (entity_type, entity_id, created_at);
create index if not exists activity_log_house_idx on public.activity_log (house, created_at desc);
alter table public.activity_log enable row level security;

create or replace function private.log_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_new jsonb := to_jsonb(new);
  v_old jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else null end;
  v_action text;
  v_meta jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := tg_table_name || '.created';
    v_meta := jsonb_build_object('status', v_new ->> 'status');
  elsif v_new ->> 'status' is distinct from v_old ->> 'status' then
    v_action := tg_table_name || '.status.' || (v_new ->> 'status');
    v_meta := jsonb_build_object('from', v_old ->> 'status');
  elsif v_new ->> 'deleted_at' is distinct from v_old ->> 'deleted_at' then
    v_action := tg_table_name || case when v_new ->> 'deleted_at' is null then '.restored' else '.trashed' end;
  elsif v_new ->> 'hold_minutes' is distinct from v_old ->> 'hold_minutes' then
    v_action := tg_table_name || '.hold_minutes';
    v_meta := jsonb_build_object('from', v_old -> 'hold_minutes', 'to', v_new -> 'hold_minutes');
  elsif v_new ->> 'table_id' is distinct from v_old ->> 'table_id' then
    v_action := tg_table_name || '.table';
    v_meta := jsonb_build_object('from', v_old -> 'table_id', 'to', v_new -> 'table_id');
  elsif v_new ->> 'payment_status' is distinct from v_old ->> 'payment_status' then
    v_action := tg_table_name || '.payment.' || (v_new ->> 'payment_status');
  else
    return null;
  end if;
  insert into public.activity_log (house, actor, action, entity_type, entity_id, meta)
  values ((v_new ->> 'house')::public.house_id, auth.uid(), v_action,
          tg_table_name, (v_new ->> 'id')::uuid, v_meta);
  return null;
end $$;

-- -----------------------------------------------------------------------------
-- 10. Shared triggers (updated_at, house immutability, activity)
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['house_ops','site_settings','settings','tables','reservations',
                           'contact_messages','menu_categories','dishes','ordering_settings',
                           'orders','checkout_intents','email_logs','event_banners'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
                   t || '_updated_at', t);
  end loop;

  foreach t in array array['tables','reservations','contact_messages','menu_categories','dishes',
                           'orders','order_items','checkout_intents','email_logs','event_banners',
                           'house_closures'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_house_immutable', t);
    execute format('create trigger %I before update on public.%I for each row execute function private.forbid_house_change()',
                   t || '_house_immutable', t);
  end loop;

  foreach t in array array['reservations','orders'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_activity', t);
    execute format('create trigger %I after insert or update on public.%I for each row execute function private.log_activity()',
                   t || '_activity', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 11. Opening rules
-- -----------------------------------------------------------------------------
create or replace function private.paris_now()
returns timestamp language sql stable set search_path = '' as $$
  select now() at time zone 'Europe/Paris';
$$;

create or replace function private.house_closed_on(p_house public.house_id, p_date date, p_scope public.closure_scope)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select extract(isodow from p_date)::smallint = any(o.closed_weekdays)
                   from public.house_ops o where o.house = p_house), false)
      or exists (select 1 from public.house_closures c
                 where c.house = p_house and p_date between c.starts_on and c.ends_on
                   and c.scope in ('all', p_scope));
$$;

create or replace function private.house_accepting_orders_at(p_house public.house_id, p_time time, p_margin integer)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  o public.house_ops;
  v_margin interval := make_interval(mins => coalesce(p_margin, 0));
begin
  select * into o from public.house_ops where house = p_house;
  if not found then return false; end if;
  if o.continuous then
    return p_time >= coalesce(o.lunch_open, o.dinner_open)
       and p_time <= coalesce(o.dinner_close, o.lunch_close) - v_margin;
  end if;
  return (o.lunch_open is not null and p_time >= o.lunch_open and p_time <= o.lunch_close - v_margin)
      or (o.dinner_open is not null and p_time >= o.dinner_open and p_time <= o.dinner_close - v_margin);
end $$;

-- Raises a stable error key when ordering is not possible right now.
create or replace function private.assert_ordering_open(
  p_house public.house_id, p_fulfillment public.fulfillment_type,
  p_method public.payment_method, p_postcode text)
returns void language plpgsql stable security definer set search_path = '' as $$
declare
  s public.ordering_settings;
  v_now timestamp := private.paris_now();
begin
  select * into s from public.ordering_settings where house = p_house;
  if not found or not (s.takeaway_enabled or s.delivery_enabled) then
    raise exception 'ordering_disabled' using errcode = 'P0001';
  end if;
  if s.paused_until is not null and s.paused_until > now() then
    raise exception 'ordering_paused' using errcode = 'P0001';
  end if;
  if p_fulfillment = 'pickup' and not s.takeaway_enabled then
    raise exception 'takeaway_disabled' using errcode = 'P0001';
  end if;
  if p_fulfillment = 'delivery' and not s.delivery_enabled then
    raise exception 'delivery_disabled' using errcode = 'P0001';
  end if;
  if p_fulfillment = 'delivery' and p_method = 'cash' then
    raise exception 'cash_not_allowed_for_delivery' using errcode = 'P0001';
  end if;
  if p_fulfillment = 'pickup' and p_method = 'cash' and not s.cash_on_pickup_enabled then
    raise exception 'cash_disabled' using errcode = 'P0001';
  end if;
  if p_fulfillment = 'delivery' and cardinality(s.delivery_postcodes) > 0
     and (p_postcode is null or not (btrim(p_postcode) = any (s.delivery_postcodes))) then
    raise exception 'delivery_postcode_not_served' using errcode = 'P0001';
  end if;
  if private.house_closed_on(p_house, v_now::date, 'orders') then
    raise exception 'house_closed' using errcode = 'P0001';
  end if;
  if not private.house_accepting_orders_at(p_house, v_now::time, s.last_order_minutes_before_close) then
    raise exception 'outside_service_hours' using errcode = 'P0001';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 12. Reservation RPCs (private, security definer; contract signatures kept)
-- The existing versions are dropped first so a different return type cannot
-- block the migration. Argument lists are unchanged.
-- -----------------------------------------------------------------------------
drop function if exists public.place_hold(public.house_id, uuid, date, time, integer, integer, text, text, text, text, public.reservation_status);
drop function if exists public.set_hold_minutes(uuid, integer);
drop function if exists public.set_reservation_status(uuid, public.reservation_status);
drop function if exists private.place_hold(public.house_id, uuid, date, time, integer, integer, text, text, text, text, public.reservation_status);
drop function if exists private.set_hold_minutes(uuid, integer);
drop function if exists private.set_reservation_status(uuid, public.reservation_status);

create or replace function private.place_hold(
  p_house public.house_id, p_table_id uuid, p_date date, p_start time, p_hold_minutes integer,
  p_guests integer, p_name text, p_phone text, p_email text, p_note text,
  p_status public.reservation_status default 'held')
returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  v_service boolean := private.is_service_role();
  v_settings public.settings;
  v_table public.tables;
  v_row public.reservations;
  v_hold integer;
  v_now timestamp := private.paris_now();
begin
  if not v_service and not private.can_access_house(p_house) then
    raise exception 'forbidden_house' using errcode = '42501';
  end if;
  if p_status not in ('held','blocked') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;
  if v_service and p_status = 'blocked' then
    raise exception 'forbidden' using errcode = '42501';  -- guests can never block a table
  end if;

  select * into v_settings from public.settings where house = p_house;
  select * into v_table from public.tables where id = p_table_id and house = p_house;
  if not found or not v_table.active then
    raise exception 'invalid_table' using errcode = 'P0001';
  end if;

  v_hold := coalesce(p_hold_minutes, v_settings.hold_minutes, 90);
  if v_hold < 15 or v_hold > 360 then
    raise exception 'invalid_hold_minutes' using errcode = 'P0001';
  end if;

  -- Guest (public website) rules. Staff taking a phone booking or blocking may override them.
  if v_service then
    if not coalesce(v_settings.reservations_enabled, true) then
      raise exception 'reservations_disabled' using errcode = 'P0001';
    end if;
    if private.house_closed_on(p_house, p_date, 'reservations') then
      raise exception 'house_closed' using errcode = 'P0001';
    end if;
    if cardinality(coalesce(v_settings.time_slots, '{}')) > 0
       and not (to_char(p_start, 'HH24:MI') = any (v_settings.time_slots)) then
      raise exception 'invalid_slot' using errcode = 'P0001';
    end if;
    if (p_date + p_start) < v_now + make_interval(mins => coalesce(v_settings.min_lead_minutes, 0)) then
      raise exception 'slot_in_past' using errcode = 'P0001';
    end if;
    if p_date > v_now::date + coalesce(v_settings.booking_horizon_days, 60) then
      raise exception 'date_too_far' using errcode = 'P0001';
    end if;
    if p_guests is null or p_guests < 1 or p_guests > coalesce(v_settings.max_party_size, 12) then
      raise exception 'party_size_invalid' using errcode = 'P0001';
    end if;
    if p_guests > v_table.seats then
      raise exception 'party_too_large_for_table' using errcode = 'P0001';
    end if;
    if coalesce(btrim(p_name), '') = '' or coalesce(btrim(p_phone), '') = '' then
      raise exception 'guest_details_required' using errcode = 'P0001';
    end if;
  end if;

  begin
    insert into public.reservations (
      house, table_id, service_date, start_time, hold_minutes, guests,
      guest_name, guest_phone, guest_email, note, status, source, created_by)
    values (
      p_house, p_table_id, p_date, p_start, v_hold,
      coalesce(p_guests, case when p_status = 'blocked' then 0 else 2 end),
      coalesce(nullif(btrim(p_name), ''), case when p_status = 'blocked' then 'Blocage' end),
      nullif(btrim(p_phone), ''), nullif(lower(btrim(p_email)), ''), nullif(btrim(p_note), ''),
      p_status, case when v_service then 'web' else 'staff' end, auth.uid())
    returning * into v_row;
  exception when exclusion_violation then
    raise exception 'table_taken' using errcode = 'P0001';
  end;
  return v_row;
end $$;

create or replace function private.set_hold_minutes(p_reservation_id uuid, p_hold_minutes integer)
returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.reservations;
begin
  select * into v_row from public.reservations where id = p_reservation_id and deleted_at is null;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if not private.can_access_house(v_row.house) then
    raise exception 'forbidden_house' using errcode = '42501';
  end if;
  if p_hold_minutes is null or p_hold_minutes < 15 or p_hold_minutes > 360 then
    raise exception 'invalid_hold_minutes' using errcode = 'P0001';
  end if;
  begin
    update public.reservations set hold_minutes = p_hold_minutes
     where id = p_reservation_id returning * into v_row;
  exception when exclusion_violation then
    raise exception 'table_taken' using errcode = 'P0001';
  end;
  return v_row;
end $$;

create or replace function private.set_reservation_status(p_reservation_id uuid, p_status public.reservation_status)
returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.reservations;
  v_ok boolean;
begin
  select * into v_row from public.reservations where id = p_reservation_id and deleted_at is null;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if not private.is_service_role() and not private.can_access_house(v_row.house) then
    raise exception 'forbidden_house' using errcode = '42501';
  end if;
  -- Guests (service role via signed cancel link) may only cancel a held/confirmed reservation.
  if private.is_service_role() and p_status <> 'cancelled' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_ok := case v_row.status
    when 'held'      then p_status in ('confirmed','released','cancelled','no_show')
    when 'confirmed' then p_status in ('released','cancelled','no_show')
    when 'blocked'   then p_status in ('released')
    else false
  end;
  if not v_ok then
    raise exception 'invalid_status_transition' using errcode = 'P0001';
  end if;

  update public.reservations
     set status       = p_status,
         confirmed_at = case when p_status = 'confirmed' then now() else confirmed_at end,
         confirmed_by = case when p_status = 'confirmed' then auth.uid() else confirmed_by end,
         cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end
   where id = p_reservation_id
   returning * into v_row;
  return v_row;
end $$;

create or replace function private.set_reservation_table(p_reservation_id uuid, p_table_id uuid)
returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.reservations;
begin
  select * into v_row from public.reservations where id = p_reservation_id and deleted_at is null;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if not private.can_access_house(v_row.house) then
    raise exception 'forbidden_house' using errcode = '42501';
  end if;
  if not exists (select 1 from public.tables t where t.id = p_table_id and t.house = v_row.house and t.active) then
    raise exception 'invalid_table' using errcode = 'P0001';
  end if;
  begin
    update public.reservations set table_id = p_table_id where id = p_reservation_id returning * into v_row;
  exception when exclusion_violation then
    raise exception 'table_taken' using errcode = 'P0001';
  end;
  return v_row;
end $$;

-- Public availability grid: occupancy only, never guest data.
create or replace function private.get_availability(p_house public.house_id, p_date date, p_guests integer default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_settings public.settings;
  v_now timestamp := private.paris_now();
  v_hold integer;
  v_closed boolean;
  v_slots jsonb;
begin
  select * into v_settings from public.settings where house = p_house;
  v_hold := coalesce(v_settings.hold_minutes, 90);
  v_closed := private.house_closed_on(p_house, p_date, 'reservations');

  select coalesce(jsonb_agg(jsonb_build_object(
           'time', s.slot,
           'past', (p_date + s.slot::time) < v_now + make_interval(mins => coalesce(v_settings.min_lead_minutes, 0)),
           'tables', (
             select coalesce(jsonb_agg(jsonb_build_object(
                      'id', t.id, 'zone', t.zone, 'number', t.number, 'seats', t.seats,
                      'fits', p_guests is null or t.seats >= p_guests,
                      'free', not exists (
                        select 1 from public.reservations r
                         where r.table_id = t.id and r.deleted_at is null
                           and r.status in ('held','blocked','confirmed')
                           and r.slot && tsrange(p_date + s.slot::time,
                                                 p_date + s.slot::time + make_interval(mins => v_hold), '[)'))
                    ) order by t.zone, t.sort_order, t.number), '[]'::jsonb)
             from public.tables t where t.house = p_house and t.active)
         ) order by s.slot), '[]'::jsonb)
    into v_slots
    from unnest(coalesce(v_settings.time_slots, '{}')) as s(slot);

  return jsonb_build_object(
    'house', p_house, 'date', p_date, 'hold_minutes', v_hold,
    'enabled', coalesce(v_settings.reservations_enabled, true),
    'closed', v_closed,
    'slots', case when v_closed then '[]'::jsonb else v_slots end);
end $$;

-- -----------------------------------------------------------------------------
-- 13. Checkout RPCs (service role only; server-authoritative pricing)
-- -----------------------------------------------------------------------------
create or replace function private.quote_order(
  p_house public.house_id, p_fulfillment public.fulfillment_type, p_items jsonb,
  p_payment_method public.payment_method default 'card', p_postcode text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  s public.ordering_settings;
  r record;
  v_lines jsonb := '[]'::jsonb;
  v_sub integer := 0;
  v_disc_base integer := 0;
  v_disc integer := 0;
  v_fee integer := 0;
begin
  if not private.is_service_role() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform private.assert_ordering_open(p_house, p_fulfillment, p_payment_method, p_postcode);
  select * into s from public.ordering_settings where house = p_house;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart' using errcode = 'P0001';
  end if;

  for r in
    select i.dish_id, i.quantity, i.notes,
           d.id as found_id, d.name, d.price_cents, d.available, d.orderable,
           c.is_drinks, c.is_active, c.orderable as cat_orderable
      from jsonb_to_recordset(p_items) as i(dish_id uuid, quantity integer, notes text)
      left join public.dishes d on d.id = i.dish_id and d.house = p_house
      left join public.menu_categories c on c.id = d.category_id and c.house = p_house
  loop
    if r.found_id is null then
      raise exception 'dish_not_found' using errcode = 'P0001';
    end if;
    if not (r.available and r.orderable and r.is_active and r.cat_orderable) then
      raise exception 'dish_unavailable' using errcode = 'P0001', detail = r.name;
    end if;
    if r.quantity is null or r.quantity < 1 or r.quantity > 50 then
      raise exception 'invalid_quantity' using errcode = 'P0001';
    end if;
    v_sub := v_sub + r.price_cents * r.quantity;
    if not r.is_drinks then
      v_disc_base := v_disc_base + r.price_cents * r.quantity;
    end if;
    v_lines := v_lines || jsonb_build_object(
      'dish_id', r.found_id, 'dish_name', r.name, 'unit_price_cents', r.price_cents,
      'quantity', r.quantity, 'line_total_cents', r.price_cents * r.quantity,
      'notes', nullif(left(btrim(coalesce(r.notes, '')), 200), ''));
  end loop;

  if p_fulfillment = 'pickup' then
    v_disc := floor(v_disc_base * s.takeaway_discount_pct / 100.0)::integer;
    v_fee := s.takeaway_fee_cents;
  else
    if v_sub < s.delivery_min_cents then
      raise exception 'delivery_minimum_not_met' using errcode = 'P0001';
    end if;
    v_fee := s.delivery_fee_cents;
  end if;

  return jsonb_build_object(
    'house', p_house, 'fulfillment', p_fulfillment, 'payment_method', p_payment_method,
    'lines', v_lines, 'subtotal_cents', v_sub, 'discount_cents', v_disc,
    'fee_cents', v_fee, 'total_cents', v_sub - v_disc + v_fee, 'currency', 'eur',
    'prep_minutes', s.prep_minutes, 'quoted_at', now());
end $$;

-- Creates order + items atomically from a quote. Idempotent per payment_intent_id.
-- p_payment: {method, status, payment_intent_id, amount_cents, stripe_payment_label}
create or replace function private.create_order(p_house public.house_id, p_quote jsonb, p_customer jsonb, p_payment jsonb)
returns table (order_id uuid, order_number text, created boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_pi      text := nullif(p_payment ->> 'payment_intent_id', '');
  v_method  public.payment_method := (p_payment ->> 'method')::public.payment_method;
  v_pstatus public.payment_status := coalesce((p_payment ->> 'status')::public.payment_status, 'pending');
  v_ful     public.fulfillment_type := (p_quote ->> 'fulfillment')::public.fulfillment_type;
  v_total   integer := (p_quote ->> 'total_cents')::integer;
  v_id      uuid;
  v_num     text;
  v_sum     integer;
begin
  if not private.is_service_role() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if (p_quote ->> 'house')::public.house_id is distinct from p_house then
    raise exception 'house_mismatch' using errcode = 'P0001';
  end if;

  if v_pi is not null then
    select o.id, o.order_number into v_id, v_num from public.orders o where o.payment_intent_id = v_pi;
    if found then
      return query select v_id, v_num, false;
      return;
    end if;
  end if;

  -- Opening rules apply before money is taken. A paid card order is always recorded.
  if v_pstatus <> 'paid' then
    perform private.assert_ordering_open(p_house, v_ful, v_method, p_customer -> 'delivery_address' ->> 'postcode');
  end if;

  begin
    insert into public.orders (
      house, status, fulfillment, customer_name, customer_phone, customer_email,
      delivery_address, requested_time, subtotal_cents, discount_cents, fee_cents, total_cents,
      payment_method, payment_status, payment_intent_id, stripe_payment_label, customer_note, needs_review)
    values (
      p_house, 'pending', v_ful,
      btrim(p_customer ->> 'name'), btrim(p_customer ->> 'phone'), lower(btrim(p_customer ->> 'email')),
      case when v_ful = 'delivery' then p_customer -> 'delivery_address' end,
      nullif(p_customer ->> 'requested_time', '')::timestamptz,
      (p_quote ->> 'subtotal_cents')::integer, (p_quote ->> 'discount_cents')::integer,
      (p_quote ->> 'fee_cents')::integer, v_total,
      v_method, v_pstatus, v_pi, nullif(p_payment ->> 'stripe_payment_label', ''),
      nullif(left(btrim(coalesce(p_customer ->> 'note', '')), 500), ''),
      (p_payment ? 'amount_cents') and (p_payment ->> 'amount_cents')::integer <> v_total)
    returning id, orders.order_number into v_id, v_num;

    insert into public.order_items (order_id, house, dish_id, dish_name, unit_price_cents, quantity, line_total_cents, notes)
    select v_id, p_house,
           (select d.id from public.dishes d where d.id = (l ->> 'dish_id')::uuid and d.house = p_house),
           l ->> 'dish_name', (l ->> 'unit_price_cents')::integer, (l ->> 'quantity')::integer,
           (l ->> 'line_total_cents')::integer, l ->> 'notes'
      from jsonb_array_elements(p_quote -> 'lines') l;

    select coalesce(sum(oi.line_total_cents), 0) into v_sum from public.order_items oi where oi.order_id = v_id;
    if v_sum <> (p_quote ->> 'subtotal_cents')::integer then
      raise exception 'quote_mismatch' using errcode = 'P0001';
    end if;
  exception when unique_violation then
    if v_pi is null then raise; end if;
    select o.id, o.order_number into v_id, v_num from public.orders o where o.payment_intent_id = v_pi;
    return query select v_id, v_num, false;
    return;
  end;

  if v_pi is not null then
    update public.checkout_intents set status = 'completed', order_id = v_id where payment_intent_id = v_pi;
  end if;
  return query select v_id, v_num, true;
end $$;

-- Public ordering status for the cart / checkout UI.
create or replace function private.get_ordering_status(p_house public.house_id)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  s public.ordering_settings;
  v_pickup text := null;
  v_delivery text := null;
begin
  select * into s from public.ordering_settings where house = p_house;
  begin
    perform private.assert_ordering_open(p_house, 'pickup', 'card', null);
  exception when others then v_pickup := sqlerrm;
  end;
  begin
    perform private.assert_ordering_open(p_house, 'delivery', 'card', s.delivery_postcodes[1]);
  exception when others then
    v_delivery := case when sqlerrm = 'delivery_postcode_not_served' then null else sqlerrm end;
  end;
  return jsonb_build_object(
    'house', p_house,
    'pickup',   jsonb_build_object('open', v_pickup is null,   'reason', v_pickup),
    'delivery', jsonb_build_object('open', v_delivery is null, 'reason', v_delivery),
    'cash_on_pickup', coalesce(s.cash_on_pickup_enabled, false),
    'prep_minutes', s.prep_minutes,
    'takeaway_fee_cents', s.takeaway_fee_cents,
    'takeaway_discount_pct', s.takeaway_discount_pct,
    'delivery_fee_cents', s.delivery_fee_cents,
    'delivery_min_cents', s.delivery_min_cents,
    'delivery_postcodes', coalesce(s.delivery_postcodes, '{}'),
    'delivery_eta_minutes', s.delivery_eta_minutes,
    'paused_until', s.paused_until);
end $$;

-- -----------------------------------------------------------------------------
-- 14. Reports (security invoker: RLS already scopes to the caller's house)
-- -----------------------------------------------------------------------------
create or replace function public.report_summary(p_house public.house_id, p_from date, p_to date)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  v jsonb;
begin
  if not private.can_access_house(p_house) then
    raise exception 'forbidden_house' using errcode = '42501';
  end if;

  with o as (
    select * from public.orders
     where house = p_house and deleted_at is null
       and (created_at at time zone 'Europe/Paris')::date between p_from and p_to
  ), live as (
    select * from o where status <> 'cancelled' and payment_status <> 'failed'
  ), r as (
    select * from public.reservations
     where house = p_house and deleted_at is null and status <> 'blocked'
       and service_date between p_from and p_to
  ), days as (
    select d::date as day from generate_series(p_from, p_to, interval '1 day') d
  )
  select jsonb_build_object(
    'house', p_house, 'from', p_from, 'to', p_to,
    'orders', jsonb_build_object(
      'count',            (select count(*) from live),
      'cancelled',        (select count(*) from o where status = 'cancelled'),
      'revenue_cents',    (select coalesce(sum(total_cents - refunded_cents), 0) from live),
      'avg_basket_cents', (select coalesce(round(avg(total_cents)), 0) from live),
      'pickup',           (select count(*) from live where fulfillment = 'pickup'),
      'delivery',         (select count(*) from live where fulfillment = 'delivery'),
      'card',             (select count(*) from live where payment_method = 'card'),
      'cash',             (select count(*) from live where payment_method = 'cash'),
      'distinct_customers', (select count(distinct customer_email) from live)),
    'reservations', jsonb_build_object(
      'total',     (select count(*) from r),
      'confirmed', (select count(*) from r where status = 'confirmed'),
      'held',      (select count(*) from r where status = 'held'),
      'released',  (select count(*) from r where status = 'released'),
      'cancelled', (select count(*) from r where status = 'cancelled'),
      'no_show',   (select count(*) from r where status = 'no_show'),
      'covers',    (select coalesce(sum(guests), 0) from r where status = 'confirmed'),
      'confirm_rate', (select case when count(*) = 0 then null
                         else round(100.0 * count(*) filter (where status = 'confirmed') / count(*), 1) end from r)),
    'by_day', (select coalesce(jsonb_agg(jsonb_build_object(
                  'day', days.day,
                  'revenue_cents', (select coalesce(sum(total_cents - refunded_cents), 0) from live
                                     where (created_at at time zone 'Europe/Paris')::date = days.day),
                  'orders', (select count(*) from live where (created_at at time zone 'Europe/Paris')::date = days.day),
                  'covers', (select coalesce(sum(guests), 0) from r where status = 'confirmed' and service_date = days.day)
                ) order by days.day), '[]'::jsonb) from days),
    'top_dishes', (select coalesce(jsonb_agg(x order by x.qty desc, x.revenue_cents desc), '[]'::jsonb) from (
                     select oi.dish_name, sum(oi.quantity) as qty, sum(oi.line_total_cents) as revenue_cents
                       from public.order_items oi join live on live.id = oi.order_id
                      group by oi.dish_name order by qty desc, revenue_cents desc limit 10) x),
    'busiest_slots', (select coalesce(jsonb_agg(y order by y.bookings desc), '[]'::jsonb) from (
                     select to_char(start_time, 'HH24:MI') as slot, count(*) as bookings, sum(guests) as guests
                       from r where status in ('confirmed','held')
                      group by 1 order by 2 desc limit 8) y)
  ) into v;
  return v;
end $$;

create or replace function public.monthly_report(p_house public.house_id, p_year integer, p_month integer)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  v_from date := make_date(p_year, p_month, 1);
  v_to   date := (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date;
  v jsonb;
begin
  if not private.can_access_house(p_house) then
    raise exception 'forbidden_house' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'house', p_house, 'year', p_year, 'month', p_month,
    'summary', public.report_summary(p_house, v_from, v_to),
    'orders', (select coalesce(jsonb_agg(jsonb_build_object(
                  'order_number', o.order_number,
                  'created_at', o.created_at,
                  'customer_name', o.customer_name,
                  'fulfillment', o.fulfillment,
                  'payment_method', o.payment_method,
                  'payment_status', o.payment_status,
                  'status', o.status,
                  'total_cents', o.total_cents,
                  'refunded_cents', o.refunded_cents) order by o.created_at), '[]'::jsonb)
               from public.orders o
              where o.house = p_house and o.deleted_at is null
                and (o.created_at at time zone 'Europe/Paris')::date between v_from and v_to)
  ) into v;
  return v;
end $$;

-- -----------------------------------------------------------------------------
-- 15. Maintenance
-- -----------------------------------------------------------------------------
create or replace function private.purge_trash(p_days integer default 35)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_cut timestamptz := now() - make_interval(days => p_days);
  n_res integer; n_ord integer; n_mail integer; n_msg integer; n_ci integer;
begin
  delete from public.reservations     where deleted_at < v_cut; get diagnostics n_res  = row_count;
  delete from public.orders           where deleted_at < v_cut; get diagnostics n_ord  = row_count;
  delete from public.email_logs       where deleted_at < v_cut; get diagnostics n_mail = row_count;
  delete from public.contact_messages where deleted_at < v_cut; get diagnostics n_msg  = row_count;
  delete from public.checkout_intents where status <> 'completed' and created_at < now() - interval '30 days';
  get diagnostics n_ci = row_count;
  return jsonb_build_object('reservations', n_res, 'orders', n_ord, 'email_logs', n_mail,
                            'contact_messages', n_msg, 'checkout_intents', n_ci);
end $$;

-- -----------------------------------------------------------------------------
-- 16. Public API wrappers (PostgREST only exposes `public`)
-- Staff/guest wrappers are SECURITY INVOKER: the private function re-checks the
-- caller. The two anon read wrappers are SECURITY DEFINER because anon has no
-- access to schema private; they return occupancy/toggles only, never PII.
-- -----------------------------------------------------------------------------
create or replace function public.place_hold(
  p_house public.house_id, p_table_id uuid, p_date date, p_start time, p_hold_minutes integer,
  p_guests integer, p_name text, p_phone text, p_email text, p_note text,
  p_status public.reservation_status default 'held')
returns public.reservations language sql security invoker set search_path = '' as $$
  select * from private.place_hold(p_house, p_table_id, p_date, p_start, p_hold_minutes,
                                   p_guests, p_name, p_phone, p_email, p_note, p_status);
$$;

create or replace function public.set_hold_minutes(p_reservation_id uuid, p_hold_minutes integer)
returns public.reservations language sql security invoker set search_path = '' as $$
  select * from private.set_hold_minutes(p_reservation_id, p_hold_minutes);
$$;

create or replace function public.set_reservation_status(p_reservation_id uuid, p_status public.reservation_status)
returns public.reservations language sql security invoker set search_path = '' as $$
  select * from private.set_reservation_status(p_reservation_id, p_status);
$$;

create or replace function public.set_reservation_table(p_reservation_id uuid, p_table_id uuid)
returns public.reservations language sql security invoker set search_path = '' as $$
  select * from private.set_reservation_table(p_reservation_id, p_table_id);
$$;

create or replace function public.get_availability(p_house public.house_id, p_date date, p_guests integer default null)
returns jsonb language sql stable security definer set search_path = '' as $$
  select private.get_availability(p_house, p_date, p_guests);
$$;

create or replace function public.get_ordering_status(p_house public.house_id)
returns jsonb language sql stable security definer set search_path = '' as $$
  select private.get_ordering_status(p_house);
$$;

create or replace function public.checkout_quote(
  p_house public.house_id, p_fulfillment public.fulfillment_type, p_items jsonb,
  p_payment_method public.payment_method default 'card', p_postcode text default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select private.quote_order(p_house, p_fulfillment, p_items, p_payment_method, p_postcode);
$$;

create or replace function public.checkout_create_order(p_house public.house_id, p_quote jsonb, p_customer jsonb, p_payment jsonb)
returns table (order_id uuid, order_number text, created boolean)
language sql security invoker set search_path = '' as $$
  select * from private.create_order(p_house, p_quote, p_customer, p_payment);
$$;

-- -----------------------------------------------------------------------------
-- 17. Function privileges (functions are EXECUTE-able by PUBLIC by default)
-- -----------------------------------------------------------------------------
do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'private' loop
    execute format('revoke all on function %s from public, anon', f);
  end loop;
end $$;

-- Staff (authenticated) + guest APIs (service_role)
grant execute on function private.is_service_role(), private.current_staff_role(), private.current_staff_house(),
                          private.is_owner(), private.is_staff(), private.can_access_house(public.house_id),
                          private.paris_now(), private.house_closed_on(public.house_id, date, public.closure_scope),
                          private.order_status_rank(public.order_status)
  to authenticated, service_role;
grant execute on function private.place_hold(public.house_id, uuid, date, time, integer, integer, text, text, text, text, public.reservation_status),
                          private.set_hold_minutes(uuid, integer),
                          private.set_reservation_status(uuid, public.reservation_status),
                          private.set_reservation_table(uuid, uuid),
                          private.get_availability(public.house_id, date, integer),
                          private.get_ordering_status(public.house_id)
  to authenticated, service_role;
grant execute on function private.quote_order(public.house_id, public.fulfillment_type, jsonb, public.payment_method, text),
                          private.create_order(public.house_id, jsonb, jsonb, jsonb),
                          private.assert_ordering_open(public.house_id, public.fulfillment_type, public.payment_method, text),
                          private.purge_trash(integer)
  to service_role;

revoke all on function public.place_hold(public.house_id, uuid, date, time, integer, integer, text, text, text, text, public.reservation_status) from public, anon;
revoke all on function public.set_hold_minutes(uuid, integer) from public, anon;
revoke all on function public.set_reservation_status(uuid, public.reservation_status) from public, anon;
revoke all on function public.set_reservation_table(uuid, uuid) from public, anon;
revoke all on function public.checkout_quote(public.house_id, public.fulfillment_type, jsonb, public.payment_method, text) from public, anon, authenticated;
revoke all on function public.checkout_create_order(public.house_id, jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.report_summary(public.house_id, date, date) from public, anon;
revoke all on function public.monthly_report(public.house_id, integer, integer) from public, anon;

grant execute on function public.place_hold(public.house_id, uuid, date, time, integer, integer, text, text, text, text, public.reservation_status) to authenticated, service_role;
grant execute on function public.set_hold_minutes(uuid, integer) to authenticated;
grant execute on function public.set_reservation_status(uuid, public.reservation_status) to authenticated, service_role;
grant execute on function public.set_reservation_table(uuid, uuid) to authenticated;
grant execute on function public.get_availability(public.house_id, date, integer) to anon, authenticated, service_role;
grant execute on function public.get_ordering_status(public.house_id) to anon, authenticated, service_role;
grant execute on function public.checkout_quote(public.house_id, public.fulfillment_type, jsonb, public.payment_method, text) to service_role;
grant execute on function public.checkout_create_order(public.house_id, jsonb, jsonb, jsonb) to service_role;
grant execute on function public.report_summary(public.house_id, date, date) to authenticated;
grant execute on function public.monthly_report(public.house_id, integer, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- 18. Admin views (security_invoker so RLS applies to the caller)
-- -----------------------------------------------------------------------------
drop view if exists public.admin_service_board;
create view public.admin_service_board with (security_invoker = true) as
select r.id,
       r.house,
       r.table_id,
       t.zone,
       t.number        as table_number,
       t.seats,
       r.service_date,
       r.start_time,
       (r.start_time + make_interval(mins => r.hold_minutes))::time as end_time,
       r.hold_minutes,
       r.guests,
       r.guest_name,
       r.guest_phone,
       r.guest_email,
       r.note,
       r.status,
       r.source,
       r.created_at,
       r.confirmed_at
  from public.reservations r
  join public.tables t on t.id = r.table_id and t.house = r.house
 where r.deleted_at is null;

drop view if exists public.admin_dashboard_today;
create view public.admin_dashboard_today with (security_invoker = true) as
with today as (select (now() at time zone 'Europe/Paris')::date as d)
select s.house,
       (select d from today) as service_date,
       (select count(*) from public.reservations r where r.house = s.house and r.deleted_at is null and r.service_date = (select d from today) and r.status = 'held')      as held,
       (select count(*) from public.reservations r where r.house = s.house and r.deleted_at is null and r.service_date = (select d from today) and r.status = 'confirmed') as confirmed,
       (select count(*) from public.reservations r where r.house = s.house and r.deleted_at is null and r.service_date = (select d from today) and r.status = 'blocked')   as blocked,
       (select count(*) from public.reservations r where r.house = s.house and r.deleted_at is null and r.service_date = (select d from today) and r.status = 'released')  as released,
       (select count(*) from public.reservations r where r.house = s.house and r.deleted_at is null and r.service_date = (select d from today) and r.status = 'cancelled') as cancelled,
       (select count(*) from public.reservations r where r.house = s.house and r.deleted_at is null and r.service_date = (select d from today) and r.status = 'no_show')   as no_show,
       (select coalesce(sum(r.guests), 0) from public.reservations r where r.house = s.house and r.deleted_at is null and r.service_date = (select d from today) and r.status in ('held','confirmed')) as covers_expected,
       (select count(*) from public.contact_messages m where m.house = s.house and m.deleted_at is null and m.status = 'new') as new_messages,
       (select count(*) from public.orders o where o.house = s.house and o.deleted_at is null and o.status in ('pending','confirmed','preparing','ready')) as active_orders,
       (select count(*) from public.orders o where o.house = s.house and o.deleted_at is null and (o.created_at at time zone 'Europe/Paris')::date = (select d from today)) as orders_today,
       (select coalesce(sum(o.total_cents - o.refunded_cents), 0) from public.orders o where o.house = s.house and o.deleted_at is null and o.status <> 'cancelled' and o.payment_status <> 'failed' and (o.created_at at time zone 'Europe/Paris')::date = (select d from today)) as revenue_today_cents,
       (select count(*) from public.orders o where o.house = s.house and o.deleted_at is null and o.payment_method = 'cash' and o.payment_status = 'pending' and o.status <> 'cancelled') as cash_to_collect
  from public.settings s;

revoke all on public.admin_service_board, public.admin_dashboard_today from anon;
grant select on public.admin_service_board, public.admin_dashboard_today to authenticated;

-- -----------------------------------------------------------------------------
-- 19. Table privileges (defense in depth on top of RLS)
-- -----------------------------------------------------------------------------
revoke insert, update, delete on public.staff_members from anon, authenticated;
revoke all on public.staff_members from anon;
revoke all on public.activity_log from anon;
revoke insert, update, delete on public.activity_log from authenticated;
revoke all on public.settings from anon;
revoke all on public.reservations, public.orders, public.order_items, public.email_logs, public.contact_messages from anon;

-- Staff never insert reservations directly (only place_hold) and only edit guest details / trash.
revoke insert, update on public.reservations from authenticated;
grant update (guest_name, guest_phone, guest_email, note, guests, deleted_at) on public.reservations to authenticated;

-- Orders: created only by checkout_create_order (service role); staff move status, cash payment, notes, trash.
revoke insert, update on public.orders from authenticated;
grant update (status, payment_status, internal_note, cancel_reason, deleted_at) on public.orders to authenticated;
revoke insert, update on public.order_items from authenticated;

revoke insert, update on public.email_logs from authenticated;
grant update (deleted_at) on public.email_logs to authenticated;

revoke insert, update on public.contact_messages from authenticated;
grant update (status, handled_by, deleted_at) on public.contact_messages to authenticated;

revoke insert, delete on public.settings, public.ordering_settings, public.house_ops from authenticated;
revoke all on public.site_settings from anon;
grant select (contact_email) on public.site_settings to anon;
revoke insert, delete on public.site_settings from authenticated;

-- -----------------------------------------------------------------------------
-- 20. Row Level Security
-- Staff scope expression (init-plan cached):
--   (select private.is_owner()) or house = (select private.current_staff_house())
-- -----------------------------------------------------------------------------
do $$
declare
  p record;
begin
  -- Drop every policy on the managed tables so this section is the single source of truth.
  for p in select schemaname, tablename, policyname from pg_policies
            where schemaname = 'public' and tablename in (
              'staff_members','house_ops','site_settings','settings','house_closures','tables',
              'reservations','contact_messages','menu_categories','dishes','ordering_settings',
              'orders','order_items','checkout_intents','email_logs','event_banners','activity_log') loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- staff_members: a staff member sees their own row; the owner sees everyone. Writes: service role only.
create policy staff_members_select on public.staff_members for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_owner()));

-- house_ops: public info (address, phone, hours). Staff edit their own house.
create policy house_ops_public_read on public.house_ops for select to anon, authenticated using (true);
create policy house_ops_staff_update on public.house_ops for update to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));

-- site_settings: brand-wide row, only the owner edits it.
create policy site_settings_public_read on public.site_settings for select to anon, authenticated using (true);
create policy site_settings_owner_update on public.site_settings for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

-- settings (templates, notify_email): staff of that house only. Never anon.
create policy settings_staff_select on public.settings for select to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()));
create policy settings_staff_update on public.settings for update to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));

-- house_closures: public read (calendar greys out the day); staff manage their own house.
create policy house_closures_public_read on public.house_closures for select to anon, authenticated using (true);
create policy house_closures_staff_write on public.house_closures for all to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));

-- tables: public reads active tables (grid); staff read/insert/update their own house. No delete (deactivate).
create policy tables_public_read on public.tables for select to anon using (active);
create policy tables_staff_select on public.tables for select to authenticated
  using (active or (select private.is_owner()) or house = (select private.current_staff_house()));
create policy tables_staff_insert on public.tables for insert to authenticated
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));
create policy tables_staff_update on public.tables for update to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));

-- reservations: staff of that house only. Inserts via place_hold. Hard delete only from the trash.
create policy reservations_staff_select on public.reservations for select to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()));
create policy reservations_staff_update on public.reservations for update to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));
create policy reservations_staff_purge on public.reservations for delete to authenticated
  using (deleted_at is not null and ((select private.is_owner()) or house = (select private.current_staff_house())));

-- contact_messages: inserted by /api/contact (service role); staff read/triage their house.
create policy contact_messages_staff_select on public.contact_messages for select to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()));
create policy contact_messages_staff_update on public.contact_messages for update to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));
create policy contact_messages_staff_purge on public.contact_messages for delete to authenticated
  using (deleted_at is not null and ((select private.is_owner()) or house = (select private.current_staff_house())));

-- menu_categories / dishes: public reads active menu; staff full CRUD on their house.
create policy menu_categories_public_read on public.menu_categories for select to anon using (is_active);
create policy menu_categories_staff_select on public.menu_categories for select to authenticated
  using (is_active or (select private.is_owner()) or house = (select private.current_staff_house()));
create policy menu_categories_staff_write on public.menu_categories for all to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));

create policy dishes_public_read on public.dishes for select to anon
  using (exists (select 1 from public.menu_categories c where c.id = dishes.category_id and c.is_active));
create policy dishes_staff_select on public.dishes for select to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house())
         or exists (select 1 from public.menu_categories c where c.id = dishes.category_id and c.is_active));
create policy dishes_staff_write on public.dishes for all to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));

-- ordering_settings: public read (fees, min, toggles); staff update their house.
create policy ordering_settings_public_read on public.ordering_settings for select to anon, authenticated using (true);
create policy ordering_settings_staff_update on public.ordering_settings for update to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));

-- orders / order_items: staff of that house only; never anon. Created by service role.
create policy orders_staff_select on public.orders for select to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()));
create policy orders_staff_update on public.orders for update to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));
create policy orders_staff_purge on public.orders for delete to authenticated
  using (deleted_at is not null and ((select private.is_owner()) or house = (select private.current_staff_house())));
create policy order_items_staff_select on public.order_items for select to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()));

-- checkout_intents: no policies at all (service role only).

-- email_logs: staff read their house journal, can trash/purge.
create policy email_logs_staff_select on public.email_logs for select to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()));
create policy email_logs_staff_update on public.email_logs for update to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));
create policy email_logs_staff_purge on public.email_logs for delete to authenticated
  using (deleted_at is not null and ((select private.is_owner()) or house = (select private.current_staff_house())));

-- event_banners: public sees enabled banners running today (Paris); staff manage their house.
create policy event_banners_public_read on public.event_banners for select to anon
  using (enabled and (now() at time zone 'Europe/Paris')::date between starts_on and ends_on);
create policy event_banners_staff_select on public.event_banners for select to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house())
         or (enabled and (now() at time zone 'Europe/Paris')::date between starts_on and ends_on));
create policy event_banners_staff_write on public.event_banners for all to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()))
  with check ((select private.is_owner()) or house = (select private.current_staff_house()));

-- activity_log: read-only history for the house.
create policy activity_log_staff_select on public.activity_log for select to authenticated
  using ((select private.is_owner()) or house = (select private.current_staff_house()));

-- -----------------------------------------------------------------------------
-- 21. Storage: one folder per house inside each bucket ({house}/...)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-images',   'dish-images',   true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
       ('event-banners', 'event-banners', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists momo_house_images_select on storage.objects;
drop policy if exists momo_house_images_insert on storage.objects;
drop policy if exists momo_house_images_update on storage.objects;
drop policy if exists momo_house_images_delete on storage.objects;

create policy momo_house_images_select on storage.objects for select to authenticated
  using (bucket_id in ('dish-images','event-banners')
         and ((select private.is_owner()) or (storage.foldername(name))[1] = (select private.current_staff_house())::text));
create policy momo_house_images_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('dish-images','event-banners')
         and ((select private.is_owner()) or (storage.foldername(name))[1] = (select private.current_staff_house())::text)
         and (storage.foldername(name))[1] in ('montmartre','poissonniere'));
create policy momo_house_images_update on storage.objects for update to authenticated
  using (bucket_id in ('dish-images','event-banners')
         and ((select private.is_owner()) or (storage.foldername(name))[1] = (select private.current_staff_house())::text))
  with check (bucket_id in ('dish-images','event-banners')
         and ((select private.is_owner()) or (storage.foldername(name))[1] = (select private.current_staff_house())::text));
create policy momo_house_images_delete on storage.objects for delete to authenticated
  using (bucket_id in ('dish-images','event-banners')
         and ((select private.is_owner()) or (storage.foldername(name))[1] = (select private.current_staff_house())::text));

-- -----------------------------------------------------------------------------
-- 22. Realtime (postgres_changes respects RLS: a house never receives the other's events)
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['reservations','orders','contact_messages','email_logs'] loop
      if not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 23. Scheduled jobs (SQL-only jobs in pg_cron; Storage cleanup runs from the
--     Next.js cron route because Supabase forbids direct DELETE on storage.objects)
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job
     where jobname in ('momo_purge_trash', 'momo_expire_checkout_intents');
    perform cron.schedule('momo_purge_trash', '15 3 * * *', $job$select private.purge_trash(35)$job$);
    perform cron.schedule('momo_expire_checkout_intents', '*/30 * * * *',
      $job$update public.checkout_intents set status = 'expired' where status = 'pending' and expires_at < now()$job$);
  else
    raise notice 'pg_cron not enabled: enable it (Database > Extensions) and re-run section 23.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 24. Seeds (never overwrite existing rows)
-- -----------------------------------------------------------------------------
insert into public.house_ops (house, display_name, address_line, postal_code, city, phone, phone_href,
                              hours_label, hours_note, lunch_open, lunch_close, dinner_open, dinner_close,
                              continuous, closed_weekdays)
values
  ('montmartre',   'Momo House Montmartre',   '85 Rue Montmartre',   '75002', 'Paris', '01 42 33 89 10', 'tel:+33142338910',
   '11h45 – 15h00 & 18h30 – 22h30', '7j/7', '11:45', '15:00', '18:30', '22:30', false, '{}'),
  ('poissonniere', 'Momo House Poissonnière', '46 Rue Poissonnière', '75010', 'Paris', '01 40 26 11 84', 'tel:+33140261184',
   '12h00 – 22h30', 'Service continu · 7j/7', '12:00', null, null, '22:30', true, '{}')
on conflict (house) do nothing;

update public.house_ops set display_name = 'Momo House Montmartre',   address_line = '85 Rue Montmartre',   postal_code = '75002'
 where house = 'montmartre'   and display_name is null;
update public.house_ops set display_name = 'Momo House Poissonnière', address_line = '46 Rue Poissonnière', postal_code = '75010'
 where house = 'poissonniere' and display_name is null;

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

insert into public.settings (house, hold_minutes, time_slots)
values
  ('montmartre',   90, array['11:45','12:00','12:15','12:30','12:45','13:00','13:15','13:30',
                           '18:30','18:45','19:00','19:15','19:30','19:45','20:00','20:15','20:30','20:45','21:00']),
  ('poissonniere', 90, array['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30',
                           '17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00'])
on conflict (house) do nothing;

insert into public.ordering_settings (house) values ('montmartre'), ('poissonniere') on conflict (house) do nothing;

insert into public.tables (house, zone, number, seats, sort_order)
select h.house::public.house_id, z.zone::public.table_zone, n, case when n <= 4 then 2 else 4 end, n
  from (values ('montmartre'), ('poissonniere')) h(house)
  cross join lateral (values ('salle', 8), ('terrasse', 4)) z(zone, cnt)
  cross join lateral generate_series(1, z.cnt) n
on conflict (house, zone, number) do nothing;

insert into public.menu_categories (house, name, name_alt, slug, display_order, is_drinks)
select h.house::public.house_id, c.name, c.name_alt, c.slug, c.ord, c.drinks
  from (values ('montmartre'), ('poissonniere')) h(house)
  cross join (values
    ('Momos',              'मम',       'momos',        10, false),
    ('Thukpa & soupes',    'थुक्पा',     'thukpa',       20, false),
    ('Street food',        null,        'street-food',  30, false),
    ('Desserts',           null,        'desserts',     40, false),
    ('Boissons',           null,        'boissons',     50, true)
  ) c(name, name_alt, slug, ord, drinks)
on conflict (house, slug) do nothing;
