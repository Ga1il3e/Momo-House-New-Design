-- Align live contact_messages with the reference contract (house is tenant key).
update public.contact_messages set house = 'montmartre' where house is null;
alter table public.contact_messages alter column house set not null;
