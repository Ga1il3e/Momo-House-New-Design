-- Must commit before later migrations use these labels.
alter type public.reservation_status add value if not exists 'confirmed';
alter type public.reservation_status add value if not exists 'cancelled';
alter type public.reservation_status add value if not exists 'no_show';
