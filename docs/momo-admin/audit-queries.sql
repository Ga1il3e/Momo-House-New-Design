-- Phase A audit queries (prompt 1 §2). Read-only.

-- A. columns
select table_name, column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public'
 order by table_name, ordinal_position;

-- B. functions
select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) args, pg_get_function_result(p.oid) result
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname in ('public','private');

-- C. policies
select schemaname, tablename, policyname, cmd, roles, qual
  from pg_policies
 where schemaname in ('public','storage');

-- D. views
select viewname, definition
  from pg_views
 where schemaname = 'public';

-- E. enums
select t.typname, array_agg(e.enumlabel order by e.enumsortorder) as labels
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
 group by t.typname;

-- F. overlap check
select a.id as a_id, b.id as b_id, a.table_id, a.service_date, a.start_time as a_start, b.start_time as b_start
  from public.reservations a
  join public.reservations b
    on a.table_id = b.table_id
   and a.id < b.id
   and a.service_date = b.service_date
   and a.status in ('held','blocked','confirmed')
   and b.status in ('held','blocked','confirmed')
   and tsrange(a.service_date + a.start_time, a.service_date + a.start_time + make_interval(mins => a.hold_minutes))
    && tsrange(b.service_date + b.start_time, b.service_date + b.start_time + make_interval(mins => b.hold_minutes));

-- G. types of start_time / hold_minutes
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'reservations'
   and column_name in ('start_time','hold_minutes');

-- H. reservation / table checks
select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid in ('public.reservations'::regclass, 'public.tables'::regclass)
 order by conname;

-- I. extensions
select extname, extversion from pg_extension where extname in ('btree_gist','pg_cron','pgcrypto');
