select * from public.admin_dashboard_today;

select
  house,
  hold_minutes,
  time_slots,
  notify_email
from public.settings
order by house;

select house, phone, hours_label, continuous
from public.house_ops
order by house;
