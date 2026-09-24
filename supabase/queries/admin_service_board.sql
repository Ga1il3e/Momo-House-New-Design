-- Staff day board. Staff session + RLS, or secret key.

select *
from public.admin_service_board
where service_date = coalesce(:service_date, (now() at time zone 'Europe/Paris')::date)
  and (:house is null or house = :house)
  and status in ('held', 'blocked', 'confirmed')
order by start_time, table_number;
