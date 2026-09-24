-- Numbered tables, timed holds, and per-house email settings.
-- Guest and staff traffic go through Route Handlers with the secret key.
-- RLS is on and no policies are granted, so the Data API cannot read these tables.

create schema if not exists private;

create type public.house_id as enum ('montmartre', 'poissonniere');
create type public.table_zone as enum ('salle', 'terrasse');
create type public.reservation_status as enum ('held', 'released', 'blocked');

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  house public.house_id not null,
  zone public.table_zone not null,
  number integer not null check (number > 0),
  seats integer not null check (seats > 0 and seats <= 12),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (house, zone, number)
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  house public.house_id not null,
  table_id uuid not null references public.tables (id),
  service_date date not null,
  start_time time not null,
  hold_minutes integer not null check (hold_minutes > 0 and hold_minutes <= 1440),
  guest_name text,
  guest_phone text,
  guest_email text,
  note text,
  guests integer not null check (guests > 0 and guests <= 12),
  status public.reservation_status not null default 'held',
  created_at timestamptz not null default now()
);

create index reservations_table_date_idx
  on public.reservations (table_id, service_date)
  where status in ('held', 'blocked');

create table public.settings (
  house public.house_id primary key,
  hold_minutes integer not null default 90 check (hold_minutes > 0 and hold_minutes <= 1440),
  guest_email_subject text not null,
  guest_email_body text not null,
  house_email_subject text not null,
  house_email_body text not null
);

alter table public.tables enable row level security;
alter table public.reservations enable row level security;
alter table public.settings enable row level security;

revoke all on table public.tables from anon, authenticated;
revoke all on table public.reservations from anon, authenticated;
revoke all on table public.settings from anon, authenticated;

insert into public.settings (
  house,
  hold_minutes,
  guest_email_subject,
  guest_email_body,
  house_email_subject,
  house_email_body
) values
(
  'montmartre',
  90,
  'Votre table est retenue — Momo House Montmartre',
  E'Bonjour {{name}},\n\nLa table {{table}} ({{zone}}) est retenue à {{house}} le {{date}} de {{start}} à {{end}}, pour {{guests}}.\n\nCe n''est pas une confirmation de visite. Appelez la maison au {{housePhone}} pour confirmer.\n\nÀ bientôt,\nMomo House',
  'Nouvelle retenue de table — Montmartre',
  E'Table {{table}} ({{zone}}) retenue le {{date}} de {{start}} à {{end}}.\nConvives : {{guests}}\nNom : {{name}}\nTéléphone : {{phone}}\nEmail : {{email}}\nNote : {{note}}'
),
(
  'poissonniere',
  90,
  'Votre table est retenue — Momo House Poissonnière',
  E'Bonjour {{name}},\n\nLa table {{table}} ({{zone}}) est retenue à {{house}} le {{date}} de {{start}} à {{end}}, pour {{guests}}.\n\nCe n''est pas une confirmation de visite. Appelez la maison au {{housePhone}} pour confirmer.\n\nÀ bientôt,\nMomo House',
  'Nouvelle retenue de table — Poissonnière',
  E'Table {{table}} ({{zone}}) retenue le {{date}} de {{start}} à {{end}}.\nConvives : {{guests}}\nNom : {{name}}\nTéléphone : {{phone}}\nEmail : {{email}}\nNote : {{note}}'
);

insert into public.tables (house, zone, number, seats)
select house, zone, number, seats
from (
  values
    ('montmartre'::public.house_id, 'salle'::public.table_zone, 1, 2),
    ('montmartre', 'salle', 2, 2),
    ('montmartre', 'salle', 3, 4),
    ('montmartre', 'salle', 4, 4),
    ('montmartre', 'salle', 5, 4),
    ('montmartre', 'salle', 6, 4),
    ('montmartre', 'salle', 7, 6),
    ('montmartre', 'salle', 8, 6),
    ('montmartre', 'terrasse', 1, 2),
    ('montmartre', 'terrasse', 2, 2),
    ('montmartre', 'terrasse', 3, 4),
    ('montmartre', 'terrasse', 4, 4),
    ('poissonniere', 'salle', 1, 2),
    ('poissonniere', 'salle', 2, 2),
    ('poissonniere', 'salle', 3, 4),
    ('poissonniere', 'salle', 4, 4),
    ('poissonniere', 'salle', 5, 4),
    ('poissonniere', 'salle', 6, 4),
    ('poissonniere', 'salle', 7, 6),
    ('poissonniere', 'salle', 8, 6),
    ('poissonniere', 'terrasse', 1, 2),
    ('poissonniere', 'terrasse', 2, 2),
    ('poissonniere', 'terrasse', 3, 4),
    ('poissonniere', 'terrasse', 4, 4)
) as seed(house, zone, number, seats);

-- Occupancy is [start, start + hold_minutes). Released rows do not block.
create or replace function private.minutes(t time)
returns integer
language sql
immutable
as $$
  select (extract(hour from t) * 60 + extract(minute from t))::integer
$$;

create or replace function private.windows_overlap(
  start_a integer,
  minutes_a integer,
  start_b integer,
  minutes_b integer
)
returns boolean
language sql
immutable
as $$
  select start_a < start_b + minutes_b and start_b < start_a + minutes_a
$$;

create or replace function private.place_hold(
  p_house public.house_id,
  p_table_id uuid,
  p_date date,
  p_start time,
  p_hold_minutes integer,
  p_guests integer,
  p_name text,
  p_phone text,
  p_email text,
  p_note text,
  p_status public.reservation_status
)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  table_row public.tables;
  created public.reservations;
begin
  if p_status not in ('held', 'blocked') then
    raise exception 'invalid_status';
  end if;

  if p_hold_minutes is null or p_hold_minutes < 1 or p_hold_minutes > 1440 then
    raise exception 'invalid_hold';
  end if;

  select * into table_row
  from public.tables
  where id = p_table_id
  for update;

  if not found or not table_row.active or table_row.house <> p_house then
    raise exception 'invalid_table';
  end if;

  if p_guests > table_row.seats then
    raise exception 'too_many_guests';
  end if;

  if exists (
    select 1
    from public.reservations r
    where r.table_id = p_table_id
      and r.service_date = p_date
      and r.status in ('held', 'blocked')
      and private.windows_overlap(
        private.minutes(r.start_time),
        r.hold_minutes,
        private.minutes(p_start),
        p_hold_minutes
      )
  ) then
    raise exception 'table_taken';
  end if;

  insert into public.reservations (
    house,
    table_id,
    service_date,
    start_time,
    hold_minutes,
    guest_name,
    guest_phone,
    guest_email,
    note,
    guests,
    status
  ) values (
    p_house,
    p_table_id,
    p_date,
    p_start,
    p_hold_minutes,
    nullif(btrim(coalesce(p_name, '')), ''),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_email, '')), ''),
    nullif(btrim(coalesce(p_note, '')), ''),
    p_guests,
    p_status
  )
  returning * into created;

  return created;
end;
$$;

create or replace function private.set_hold_minutes(
  p_reservation_id uuid,
  p_hold_minutes integer
)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.reservations;
  updated public.reservations;
begin
  if p_hold_minutes is null or p_hold_minutes < 1 or p_hold_minutes > 1440 then
    raise exception 'invalid_hold';
  end if;

  select * into current_row
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found or current_row.status = 'released' then
    raise exception 'not_found';
  end if;

  if exists (
    select 1
    from public.reservations r
    where r.table_id = current_row.table_id
      and r.service_date = current_row.service_date
      and r.status in ('held', 'blocked')
      and r.id <> current_row.id
      and private.windows_overlap(
        private.minutes(r.start_time),
        r.hold_minutes,
        private.minutes(current_row.start_time),
        p_hold_minutes
      )
  ) then
    raise exception 'table_taken';
  end if;

  update public.reservations
  set hold_minutes = p_hold_minutes
  where id = current_row.id
  returning * into updated;

  return updated;
end;
$$;

revoke all on function private.minutes(time) from public, anon, authenticated;
revoke all on function private.windows_overlap(integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function private.place_hold(
  public.house_id, uuid, date, time, integer, integer, text, text, text, text, public.reservation_status
) from public, anon, authenticated;
revoke all on function private.set_hold_minutes(uuid, integer) from public, anon, authenticated;

grant usage on schema private to service_role;
grant execute on function private.place_hold(
  public.house_id, uuid, date, time, integer, integer, text, text, text, text, public.reservation_status
) to service_role;
grant execute on function private.set_hold_minutes(uuid, integer) to service_role;
