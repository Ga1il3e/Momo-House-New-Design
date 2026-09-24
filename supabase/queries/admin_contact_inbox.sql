select *
from public.contact_messages
where (:status is null or status = :status)
order by created_at desc;

update public.contact_messages
set status = :status
where id = :id
returning *;
