-- Guest hold from POST /api/reservations. Always status = held.
-- Overlap is enforced inside private.place_hold.

select *
from private.place_hold(
  :house,
  :table_id,
  :service_date,
  :start_time,
  (select hold_minutes from public.settings where house = :house),
  :guests,
  :name,
  :phone,
  :email,
  :note,
  'held'
);
