select id, house, zone, number, seats, active
from public.tables
order by house, zone, number;

insert into public.tables (house, zone, number, seats, active)
values (:house, :zone, :number, :seats, true)
returning *;

update public.tables
set
  house = :house,
  zone = :zone,
  number = :number,
  seats = :seats,
  active = :active
where id = :id
returning *;

-- Retire a table without deleting history.
update public.tables
set active = false
where id = :id
returning *;
