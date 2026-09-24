-- Release a guest hold or a staff block.
select * from private.set_reservation_status(:reservation_id, 'released');

-- Confirm after the house called the guest.
select * from private.set_reservation_status(:reservation_id, 'confirmed');

-- Guest cancelled, or staff cancelled.
select * from private.set_reservation_status(:reservation_id, 'cancelled');

-- Guest did not arrive.
select * from private.set_reservation_status(:reservation_id, 'no_show');

-- Change the occupancy window (minutes from start). Fails if it overlaps.
select * from private.set_hold_minutes(:reservation_id, :hold_minutes);

-- Manual block without guest email.
select * from private.place_hold(
  :house,
  :table_id,
  :service_date,
  :start_time,
  :hold_minutes,
  :guests,
  '',
  '',
  '',
  coalesce(:note, 'Blocage manuel'),
  'blocked'
);
