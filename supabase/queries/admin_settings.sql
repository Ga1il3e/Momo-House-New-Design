update public.settings
set
  hold_minutes = :hold_minutes,
  time_slots = :time_slots,
  notify_email = :notify_email,
  guest_email_subject = :guest_email_subject,
  guest_email_body = :guest_email_body,
  house_email_subject = :house_email_subject,
  house_email_body = :house_email_body
where house = :house
returning *;

update public.house_ops
set
  phone = :phone,
  phone_href = :phone_href,
  hours_label = :hours_label,
  hours_note = :hours_note,
  lunch_open = :lunch_open,
  lunch_close = :lunch_close,
  dinner_open = :dinner_open,
  dinner_close = :dinner_close,
  continuous = :continuous,
  updated_at = now()
where house = :house
returning *;

update public.site_settings
set
  contact_email = :contact_email,
  updated_at = now()
where id = true
returning *;
