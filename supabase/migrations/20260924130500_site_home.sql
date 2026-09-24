-- Homepage ticker and featured dishes on the single site_settings row.
-- Anon already reads contact_email; extend that column grant for the public home.

alter table public.site_settings
  add column if not exists home_banner_left text,
  add column if not exists home_banner_right text,
  add column if not exists featured_dish_ids uuid[] not null default '{}';

grant select (contact_email, home_banner_left, home_banner_right, featured_dish_ids)
  on public.site_settings to anon;
