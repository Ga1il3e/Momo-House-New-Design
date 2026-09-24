-- Optional contact inbox for a later contact form.
-- Website writes through a Route Handler using the secret key.

insert into public.contact_messages (house, name, email, phone, subject, message)
values (:house, :name, :email, :phone, :subject, :message)
returning *;
