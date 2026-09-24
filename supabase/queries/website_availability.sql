-- Public reservation grid. Run via the secret-key Route Handler, not the browser.
-- Occupancy is [start, start + hold_minutes). Released / cancelled / no_show do not block.

select
  t.id,
  t.number,
  t.seats,
  t.zone,
  case
    when exists (
      select 1
      from public.reservations r
      where r.table_id = t.id
        and r.service_date = :service_date
        and r.status in ('held', 'blocked', 'confirmed')
        and private.windows_overlap(
          private.minutes(r.start_time),
          r.hold_minutes,
          private.minutes(:start_time),
          s.hold_minutes
        )
    ) then 'taken'
    when t.seats < :guests then 'too_small'
    else 'free'
  end as state
from public.tables t
join public.settings s on s.house = t.house
where t.house = :house
  and t.zone = :zone
  and t.active = true
order by t.number;
