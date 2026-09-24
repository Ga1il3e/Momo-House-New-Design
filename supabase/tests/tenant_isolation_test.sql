-- =============================================================================
-- Momo House — tenant isolation & business-rule test
-- Run in the Supabase SQL editor (or psql as postgres). Everything happens in
-- one transaction and is ROLLED BACK at the end: no data is left behind.
-- Every line printed as "ok:" is a passing check; any failure aborts loudly.
-- =============================================================================
begin;

-- ---------- helpers -----------------------------------------------------------
create function pg_temp.act_as(p_uid text, p_role text default 'authenticated') returns void
language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims',
    case when p_uid is null then json_build_object('role', p_role)::text
         else json_build_object('sub', p_uid, 'role', p_role)::text end, true);
  perform set_config('role', p_role, true);
end $$;

create function pg_temp.expect_error(p_sql text, p_expected text) returns void
language plpgsql as $$
begin
  execute p_sql;
  raise exception 'EXPECTED_ERROR [%] but statement succeeded: %', p_expected, p_sql;
exception when others then
  if sqlerrm like 'EXPECTED_ERROR%' then raise; end if;
  if position(p_expected in sqlerrm) = 0 then
    raise exception 'expected [%] got [%] for: %', p_expected, sqlerrm, p_sql;
  end if;
  raise notice 'ok: % (%)', p_expected, left(p_sql, 70);
end $$;

create function pg_temp.check(p_ok boolean, p_label text) returns void
language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FAILED: %', p_label; end if;
  raise notice 'ok: %', p_label;
end $$;

grant execute on function pg_temp.act_as(text, text), pg_temp.expect_error(text, text), pg_temp.check(boolean, text)
  to anon, authenticated, service_role;

-- ---------- fixtures (as postgres) -------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'montmartre@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'poissonniere@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'owner@test.local'),
  ('00000000-0000-0000-0000-00000000000d', 'former@test.local');
insert into public.staff_members (user_id, role, house) values
  ('00000000-0000-0000-0000-00000000000a', 'staff', 'montmartre'),
  ('00000000-0000-0000-0000-00000000000b', 'staff', 'poissonniere'),
  ('00000000-0000-0000-0000-00000000000c', 'owner', null),
  ('00000000-0000-0000-0000-00000000000d', 'staff', 'montmartre');
update public.staff_members set active = false where user_id = '00000000-0000-0000-0000-00000000000d';

select pg_temp.check((select raw_app_meta_data ->> 'house' from auth.users where id = '00000000-0000-0000-0000-00000000000a') = 'montmartre',
                     'staff_members mirrors house into app_metadata');
select pg_temp.check((select raw_app_meta_data ->> 'role' from auth.users where id = '00000000-0000-0000-0000-00000000000d') = 'disabled',
                     'deactivated staff gets role=disabled in app_metadata');

-- Open both houses all day inside this transaction so ordering tests are time-independent.
update public.house_ops set continuous = true, lunch_open = '00:00', dinner_close = '23:59', closed_weekdays = '{}';
update public.ordering_settings set takeaway_enabled = true, delivery_enabled = true, last_order_minutes_before_close = 0,
       delivery_min_cents = 1500, delivery_postcodes = '{75002,75010}', takeaway_discount_pct = 10;
update public.settings set min_lead_minutes = 0, reservations_enabled = true, time_slots = array['12:00','19:30','20:00','21:00'];

create temp table fx as
select (select id from public.tables where house = 'montmartre'   and zone = 'salle' and number = 1) as m_t1,
       (select id from public.tables where house = 'montmartre'   and zone = 'salle' and number = 2) as m_t2,
       (select id from public.tables where house = 'poissonniere' and zone = 'salle' and number = 1) as p_t1,
       current_date + 3 as d;
insert into public.menu_categories (house, name, slug) values ('poissonniere', 'Test P', 'test-p') on conflict do nothing;
insert into public.dishes (house, category_id, name, price_cents)
select 'montmartre', id, 'Momo test M', 1100 from public.menu_categories where house = 'montmartre' and slug = 'momos';
insert into public.dishes (house, category_id, name, price_cents)
select 'montmartre', id, 'Lassi test M', 450 from public.menu_categories where house = 'montmartre' and slug = 'boissons';
insert into public.dishes (house, category_id, name, price_cents)
select 'poissonniere', id, 'Momo test P', 1200 from public.menu_categories where house = 'poissonniere' and slug = 'momos';
grant select on fx to anon, authenticated, service_role;

-- ---------- 1. guest hold via service role (website) -------------------------
select pg_temp.act_as(null, 'service_role');
select pg_temp.check((select (public.place_hold('montmartre', m_t1, d, '19:30', null, 2, 'Guest One', '0600000000', 'g@x.fr', null, 'held')).source from fx) = 'web',
                     'guest hold via service role is saved with source=web');
select pg_temp.expect_error($$select public.place_hold('montmartre', (select m_t1 from fx), (select d from fx), '20:00', null, 2, 'G2', '06', null, null, 'held')$$, 'table_taken');
select pg_temp.check((select (public.place_hold('montmartre', m_t1, d, '21:00', null, 2, 'Guest Two', '0600000001', null, null, 'held')).status from fx) = 'held',
                     '19:30 + 90 min frees the table at 21:00');
select pg_temp.expect_error($$select public.place_hold('montmartre', (select m_t2 from fx), (select d from fx), '19:30', null, 2, 'X', '06', null, null, 'blocked')$$, 'forbidden');
select pg_temp.expect_error($$select public.place_hold('montmartre', (select m_t2 from fx), (select d from fx), '19:37', null, 2, 'X', '06', null, null, 'held')$$, 'invalid_slot');
select pg_temp.expect_error($$select public.place_hold('montmartre', (select p_t1 from fx), (select d from fx), '19:30', null, 2, 'X', '06', null, null, 'held')$$, 'invalid_table');
select pg_temp.check(((public.get_availability('montmartre', (select d from fx), 2)) ->> 'enabled')::boolean, 'service role can read availability');
create temp table mid as select id from public.reservations where guest_name = 'Guest One';
grant select on mid to authenticated;

-- ---------- 2. Montmartre staff ----------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from public.reservations) = 2 and (select count(*) from public.reservations where house = 'poissonniere') = 0,
                     'Montmartre staff sees only Montmartre reservations');
select pg_temp.check((select (public.place_hold('montmartre', m_t2, d, '19:37', 120, 4, null, null, null, 'Anniversaire', 'blocked')).source from fx) = 'staff',
                     'staff can block any time (off-grid) on own house');
select pg_temp.expect_error($$select public.place_hold('poissonniere', (select p_t1 from fx), (select d from fx), '19:30', null, 2, 'X', '06', null, null, 'held')$$, 'forbidden_house');
select pg_temp.expect_error($$insert into public.tables (house, zone, number, seats) values ('poissonniere', 'salle', 99, 2)$$, 'row-level security');
select pg_temp.expect_error($$insert into public.reservations (house, table_id, service_date, start_time) values ('montmartre', (select m_t1 from fx), current_date + 9, '12:00')$$, 'permission denied');
select pg_temp.check((select count(*) from public.settings) = 1, 'Montmartre staff reads only its own settings row');
select pg_temp.check((select count(*) from public.admin_dashboard_today) = 1 and (select house from public.admin_dashboard_today) = 'montmartre',
                     'admin_dashboard_today is scoped to the house (security_invoker)');
select pg_temp.expect_error($$update public.reservations set house = 'poissonniere'$$, 'permission denied');

-- hold minutes / status machine
select pg_temp.expect_error($$select public.set_hold_minutes((select id from public.reservations where guest_name = 'Guest One'), 120)$$, 'table_taken');
select pg_temp.check((select (public.set_reservation_status(id, 'confirmed')).confirmed_by from public.reservations where guest_name = 'Guest One')
                     = '00000000-0000-0000-0000-00000000000a', 'Confirmer records who confirmed');
select pg_temp.expect_error($$select public.set_reservation_status((select id from public.reservations where guest_name = 'Guest One'), 'held')$$, 'invalid_status_transition');
select pg_temp.check((select (public.set_reservation_status(id, 'released')).status from public.reservations where guest_name = 'Guest Two') = 'released',
                     'Libérer releases a hold');
select pg_temp.check((select (public.set_hold_minutes(id, 180)).hold_minutes from public.reservations where guest_name = 'Guest One') = 180,
                     'hold can be extended once the next slot is released');
select pg_temp.check((select count(*) from public.activity_log where entity_type = 'reservations') >= 4, 'activity log records reservation changes');

-- storage folders
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name) values ('dish-images', 'poissonniere/dishes/x.webp')$$, 'row-level security');
insert into storage.objects (bucket_id, name) values ('dish-images', 'montmartre/dishes/x.webp');
select pg_temp.check(true, 'Montmartre staff can upload into montmartre/ folder');

-- ---------- 3. Poissonnière staff cannot see or touch Montmartre -------------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*) from public.reservations) = 0, 'Poissonnière staff sees zero Montmartre reservations');
select pg_temp.check((select count(*) from storage.objects) = 0, 'Poissonnière staff cannot list Montmartre images');
with u as (update public.reservations set note = 'hacked' returning 1) select pg_temp.check((select count(*) from u) = 0, 'cross-house UPDATE affects 0 rows');
with u as (update public.settings set notify_email = 'x@evil.fr' where house = 'montmartre' returning 1) select pg_temp.check((select count(*) from u) = 0, 'cross-house settings UPDATE affects 0 rows');
select pg_temp.expect_error($$select public.set_reservation_status((select id from mid), 'cancelled')$$, 'forbidden_house');
select pg_temp.expect_error($$select public.set_hold_minutes((select id from mid), 30)$$, 'forbidden_house');
select pg_temp.expect_error($$select public.report_summary('montmartre', current_date - 7, current_date)$$, 'forbidden_house');

-- ---------- 4. deactivated staff and anon ------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000d');
select pg_temp.check((select count(*) from public.reservations) = 0, 'deactivated staff sees nothing');
select pg_temp.act_as(null, 'anon');
select pg_temp.expect_error($$select count(*) from public.reservations$$, 'permission denied');
select pg_temp.expect_error($$select count(*) from public.settings$$, 'permission denied');
select pg_temp.check((select count(*) from public.tables) > 0, 'anon reads active tables for the public grid');
select pg_temp.check(jsonb_array_length((public.get_availability('montmartre', current_date + 3, 2)) -> 'slots') > 0, 'anon reads availability (no guest data)');
select pg_temp.expect_error($$select public.place_hold('montmartre', (select m_t1 from fx), current_date + 5, '19:30', null, 2, 'X', '06', null, null, 'held')$$, 'permission denied');
select pg_temp.expect_error($$select public.checkout_quote('montmartre', 'pickup', '[]'::jsonb)$$, 'permission denied');

-- ---------- 5. orders: payment-first + idempotency ----------------------------
select pg_temp.act_as(null, 'service_role');
create temp table q as
select public.checkout_quote('montmartre', 'pickup',
         jsonb_build_array(
           jsonb_build_object('dish_id', (select id from public.dishes where name = 'Momo test M'),  'quantity', 2),
           jsonb_build_object('dish_id', (select id from public.dishes where name = 'Lassi test M'), 'quantity', 1))) as quote;
select pg_temp.check((select (quote ->> 'total_cents')::int from q) = 2200 + 450 - 220, 'quote: 10% takeaway discount excludes drinks');
select pg_temp.expect_error($$select public.checkout_quote('montmartre', 'pickup', jsonb_build_array(jsonb_build_object('dish_id', (select id from public.dishes where name = 'Momo test P'), 'quantity', 1)))$$, 'dish_not_found');
select pg_temp.expect_error($$select public.checkout_quote('montmartre', 'delivery', jsonb_build_array(jsonb_build_object('dish_id', (select id from public.dishes where name = 'Momo test M'), 'quantity', 1)), 'cash', '75002')$$, 'cash_not_allowed_for_delivery');
select pg_temp.expect_error($$select public.checkout_quote('montmartre', 'delivery', jsonb_build_array(jsonb_build_object('dish_id', (select id from public.dishes where name = 'Momo test M'), 'quantity', 1)), 'card', '75002')$$, 'delivery_minimum_not_met');
select pg_temp.expect_error($$select public.checkout_quote('montmartre', 'delivery', jsonb_build_array(jsonb_build_object('dish_id', (select id from public.dishes where name = 'Momo test M'), 'quantity', 3)), 'card', '75019')$$, 'delivery_postcode_not_served');

insert into public.checkout_intents (house, payment_intent_id, quote, customer, amount_cents)
select 'montmartre', 'pi_test_1', quote, '{"name":"Card Guest","phone":"0611","email":"CARD@x.fr"}', (quote ->> 'total_cents')::int from q;
select pg_temp.check((select count(*) from public.orders) = 0, 'no order exists before Stripe success');
select pg_temp.check((select created from public.checkout_create_order('montmartre', (select quote from q),
                        '{"name":"Card Guest","phone":"0611","email":"CARD@x.fr"}',
                        jsonb_build_object('method','card','status','paid','payment_intent_id','pi_test_1','amount_cents',(select (quote->>'total_cents')::int from q)))),
                     'paid finalize creates the order');
select pg_temp.check(not (select created from public.checkout_create_order('montmartre', (select quote from q),
                        '{"name":"Card Guest","phone":"0611","email":"CARD@x.fr"}',
                        jsonb_build_object('method','card','status','paid','payment_intent_id','pi_test_1'))),
                     'second finalize (webhook + confirm race) is idempotent');
select pg_temp.check((select count(*) from public.orders) = 1 and (select status from public.checkout_intents where payment_intent_id = 'pi_test_1') = 'completed',
                     'exactly one order, intent completed');
select pg_temp.check((select order_number from public.orders) ~ '^M\d{6}-001$', 'order number is per-house (M…-001)');
select pg_temp.check((select customer_email from public.orders) = 'card@x.fr' and (select count(*) from public.order_items) = 2, 'order items copied from quote');

-- paid order still recorded even if the house pauses ordering after payment
update public.ordering_settings set paused_until = now() + interval '30 minutes' where house = 'montmartre';
select pg_temp.expect_error($$select public.checkout_quote('montmartre', 'pickup', jsonb_build_array(jsonb_build_object('dish_id', (select id from public.dishes where name = 'Momo test M'), 'quantity', 1)))$$, 'ordering_paused');
select pg_temp.check((select created from public.checkout_create_order('montmartre', (select quote from q), '{"name":"Late","phone":"06","email":"l@x.fr"}',
                        jsonb_build_object('method','card','status','paid','payment_intent_id','pi_test_2','amount_cents',1))),
                     'paid card order is recorded even when ordering got paused');
select pg_temp.check((select needs_review from public.orders where payment_intent_id = 'pi_test_2'), 'amount mismatch flags needs_review');
select pg_temp.expect_error($$select public.checkout_create_order('montmartre', (select quote from q), '{"name":"Cash","phone":"06","email":"c@x.fr"}', '{"method":"cash"}')$$, 'ordering_paused');
update public.ordering_settings set paused_until = null where house = 'montmartre';
select pg_temp.check((select created from public.checkout_create_order('montmartre', (select quote from q), '{"name":"Cash","phone":"06","email":"c@x.fr"}', '{"method":"cash"}')),
                     'cash on pickup order is created immediately');
insert into public.email_logs (house, type, to_email, status, entity_type, entity_id)
select 'montmartre', 'order_confirmation', 'card@x.fr', 'sent', 'order', id from public.orders where payment_intent_id = 'pi_test_1';
select pg_temp.expect_error($$insert into public.email_logs (house, type, to_email, status, entity_type, entity_id) select 'montmartre', 'order_confirmation', 'card@x.fr', 'queued', 'order', id from public.orders where payment_intent_id = 'pi_test_1'$$, 'duplicate key');

-- staff rules on orders
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from public.orders) = 3, 'Montmartre staff sees its 3 orders');
select pg_temp.expect_error($$update public.orders set status = 'cancelled' where payment_intent_id = 'pi_test_1'$$, 'refund_required');
update public.orders set status = 'preparing' where payment_intent_id = 'pi_test_1';
select pg_temp.expect_error($$update public.orders set status = 'confirmed' where payment_intent_id = 'pi_test_1'$$, 'invalid_status_transition');
select pg_temp.expect_error($$update public.orders set payment_status = 'refunded' where payment_intent_id = 'pi_test_1'$$, 'payment_status_locked');
select pg_temp.expect_error($$update public.orders set total_cents = 1 where payment_intent_id = 'pi_test_1'$$, 'permission denied');
update public.orders set payment_status = 'paid' where payment_method = 'cash';
select pg_temp.check((select paid_at is not null from public.orders where payment_method = 'cash'), 'staff can mark cash as encaissé');
select pg_temp.check(((public.report_summary('montmartre', current_date - 1, current_date + 1)) -> 'orders' ->> 'count')::int = 3, 'report_summary counts own orders');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*) from public.orders) = 0 and (select count(*) from public.order_items) = 0, 'Poissonnière staff sees zero Montmartre orders');

-- ---------- 6. owner sees both houses -----------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(distinct house) from public.admin_dashboard_today) = 2, 'owner sees both houses on the dashboard');
select pg_temp.check((select count(*) from public.orders) = 3, 'owner sees Montmartre orders');
select pg_temp.check((select count(*) from public.staff_members) = 4, 'owner sees the whole team');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from public.staff_members) = 1, 'staff sees only their own staff row');

reset role;
rollback;
