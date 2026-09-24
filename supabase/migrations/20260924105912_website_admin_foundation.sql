-- Extends table holds so the public site and a future admin portal
-- share one source of truth. Guests never get table grants.
-- Staff read/write through RLS when app_metadata.role = 'staff'.
-- Guest holds still go through Route Handlers that use the secret key.

alter table public.settings
  add column if not exists notify_email text,
  add column if not exists time_slots text[] not null default array[
    '12:00', '12:30', '13:00', '13:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

update public.settings
set
  notify_email = coalesce(notify_email, 'montmartre@momohouse.fr'),
  time_slots = array['12:00', '12:30', '13:00', '13:30', '19:00', '19:30', '20:00', '20:30', '21:00']
where house = 'montmartre';

update public.settings
set
  notify_email = coalesce(notify_email, 'poissonniere@momohouse.fr'),
  time_slots = array['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']
where house = 'poissonniere';

create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  contact_email text not null default 'contact@momohouse.fr',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, contact_email)
values (true, 'contact@momohouse.fr')
on conflict (id) do nothing;

create table if not exists public.house_ops (
  house public.house_id primary key,
  phone text not null,
  phone_href text not null,
  hours_label text not null,
  hours_note text not null,
  lunch_open time,
  lunch_close time,
  dinner_open time,
  dinner_close time,
  continuous boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.house_ops (
  house, phone, phone_href, hours_label, hours_note,
  lunch_open, lunch_close, dinner_open, dinner_close, continuous
) values
(
  'montmartre',
  '01 42 33 89 10',
  'tel:+33142338910',
  '11h45 – 15h00 & 18h30 – 22h30',
  'Ouvert 7j/7',
  '11:45', '15:00', '18:30', '22:30',
  false
),
(
  'poissonniere',
  '01 40 26 11 84',
  'tel:+33140261184',
  '12h00 – 22h30 sans interruption',
  'Service Continu',
  '12:00', '22:30', null, null,
  true
)
on conflict (house) do nothing;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  house public.house_id,
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

create or replace function private.is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'staff', false)
$$;

create or replace function private.is_privileged()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('postgres', 'service_role') or private.is_staff()
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
  if not private.is_privileged() then
    raise exception 'unauthorized';
  end if;

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
      and r.status in ('held', 'blocked', 'confirmed')
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
    house, table_id, service_date, start_time, hold_minutes,
    guest_name, guest_phone, guest_email, note, guests, status
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
  if not private.is_privileged() then
    raise exception 'unauthorized';
  end if;

  if p_hold_minutes is null or p_hold_minutes < 1 or p_hold_minutes > 1440 then
    raise exception 'invalid_hold';
  end if;

  select * into current_row
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found or current_row.status in ('released', 'cancelled', 'no_show') then
    raise exception 'not_found';
  end if;

  if exists (
    select 1
    from public.reservations r
    where r.table_id = current_row.table_id
      and r.service_date = current_row.service_date
      and r.status in ('held', 'blocked', 'confirmed')
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

create or replace function private.set_reservation_status(
  p_reservation_id uuid,
  p_status public.reservation_status
)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated public.reservations;
begin
  if not private.is_privileged() then
    raise exception 'unauthorized';
  end if;

  update public.reservations
  set status = p_status
  where id = p_reservation_id
  returning * into updated;

  if not found then
    raise exception 'not_found';
  end if;

  return updated;
end;
$$;

drop view if exists public.admin_service_board;
create view public.admin_service_board
with (security_invoker = true)
as
select
  r.id,
  r.house,
  r.table_id,
  t.number as table_number,
  t.zone,
  t.seats,
  r.service_date,
  r.start_time,
  r.hold_minutes,
  (r.start_time + make_interval(mins => r.hold_minutes))::time as end_time,
  r.guest_name,
  r.guest_phone,
  r.guest_email,
  r.note,
  r.guests,
  r.status,
  r.created_at
from public.reservations r
join public.tables t on t.id = r.table_id;

drop view if exists public.admin_dashboard_today;
create view public.admin_dashboard_today
with (security_invoker = true)
as
select
  house,
  count(*) filter (where status in ('held', 'confirmed', 'blocked')) as active_holds,
  count(*) filter (where status = 'held') as pending_calls,
  count(*) filter (where status = 'confirmed') as confirmed,
  count(*) filter (where status = 'blocked') as blocked,
  count(*) filter (where status = 'released') as released
from public.reservations
where service_date = ((now() at time zone 'Europe/Paris')::date)
group by house;

alter table public.site_settings enable row level security;
alter table public.house_ops enable row level security;
alter table public.contact_messages enable row level security;

revoke all on table public.site_settings from anon, authenticated;
revoke all on table public.house_ops from anon, authenticated;
revoke all on table public.contact_messages from anon, authenticated;
revoke all on table public.tables from anon, authenticated;
revoke all on table public.reservations from anon, authenticated;
revoke all on table public.settings from anon, authenticated;

grant select, insert, update on table public.tables to authenticated;
grant select, insert, update on table public.reservations to authenticated;
grant select, update on table public.settings to authenticated;
grant select, update on table public.site_settings to authenticated;
grant select, update on table public.house_ops to authenticated;
grant select, insert, update on table public.contact_messages to authenticated;
grant select on public.admin_service_board to authenticated;
grant select on public.admin_dashboard_today to authenticated;

drop policy if exists staff_all_tables on public.tables;
create policy staff_all_tables on public.tables
  for all to authenticated
  using (private.is_staff())
  with check (private.is_staff());

drop policy if exists staff_all_reservations on public.reservations;
create policy staff_all_reservations on public.reservations
  for all to authenticated
  using (private.is_staff())
  with check (private.is_staff());

drop policy if exists staff_all_settings on public.settings;
create policy staff_all_settings on public.settings
  for all to authenticated
  using (private.is_staff())
  with check (private.is_staff());

drop policy if exists staff_all_site_settings on public.site_settings;
create policy staff_all_site_settings on public.site_settings
  for all to authenticated
  using (private.is_staff())
  with check (private.is_staff());

drop policy if exists staff_all_house_ops on public.house_ops;
create policy staff_all_house_ops on public.house_ops
  for all to authenticated
  using (private.is_staff())
  with check (private.is_staff());

drop policy if exists staff_all_contact on public.contact_messages;
create policy staff_all_contact on public.contact_messages
  for all to authenticated
  using (private.is_staff())
  with check (private.is_staff());

grant usage on schema private to authenticated, service_role;
grant execute on function private.is_staff() to authenticated, service_role;
grant execute on function private.is_privileged() to authenticated, service_role;
grant execute on function private.place_hold(
  public.house_id, uuid, date, time, integer, integer, text, text, text, text, public.reservation_status
) to authenticated, service_role;
grant execute on function private.set_hold_minutes(uuid, integer) to authenticated, service_role;
grant execute on function private.set_reservation_status(uuid, public.reservation_status) to authenticated, service_role;
