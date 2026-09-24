-- Run in the Supabase SQL editor after creating the staff Auth user.
-- Replace the email. Role must live in raw_app_meta_data, never user_metadata.

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"staff"}'::jsonb
where email = 'staff@momohouse.fr';
