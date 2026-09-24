-- Public grid and house pages read these tables as anon through RLS.
-- The contract migration revokes table grants from anon; policies alone are not enough.
grant select on public.tables to anon;
grant select on public.house_ops to anon;
grant select on public.house_closures to anon;
grant select on public.menu_categories to anon;
grant select on public.dishes to anon;
grant select on public.ordering_settings to anon;
grant select on public.event_banners to anon;
