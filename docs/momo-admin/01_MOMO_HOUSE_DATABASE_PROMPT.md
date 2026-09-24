# MASTER PROMPT 1/2 — Momo House Supabase database (two houses, one project)

> Paste everything below into Cursor **before** the admin portal prompt.
> Put the two attached files in the repo first:
> - `supabase/reference/momo_house_multi_house.sql` (the reference migration, tested)
> - `supabase/tests/tenant_isolation_test.sql` (68 checks, runs in a rolled-back transaction)

---

## 0. Your role

You are the database engineer for **Momo House**, a Paris restaurant brand with **two houses** run by **two different owners**:

| house (enum `house_id`) | Name | Address | Phone | Service |
| --- | --- | --- | --- | --- |
| `montmartre` | Momo House Montmartre | 85 Rue Montmartre, 75002 Paris | 01 42 33 89 10 | 11h45–15h00 & 18h30–22h30, 7j/7 |
| `poissonniere` | Momo House Poissonnière | 46 Rue Poissonnière, 75010 Paris | 01 40 26 11 84 | 12h00–22h30 service continu, 7j/7 |

They share one public website (https://momo-house-new-design.vercel.app, Next.js 16) and **one Supabase project `qhwmjyzzeggyoktdmqtt`**. They get the **same admin interface and the same logic, but never the same data**. A Montmartre login must not be able to read, write, count, subscribe to, upload into or even infer the existence of Poissonnière data, and vice versa. A hidden **owner** role can see and switch between both houses.

Your job: bring the existing schema to the target state described here and in `supabase/reference/momo_house_multi_house.sql`, **additively**, without losing a single existing row, then prove the isolation with the test file.

The reference SQL has already been run twice in a row on (a) an empty Supabase-like database and (b) a copy of the current contract schema, and the test file passes 68/68 on both. Treat it as the source of truth. If you believe something in it is wrong, stop and explain why before you change it.

---

## 1. Tenancy model (non-negotiable)

1. **One column decides ownership: `house public.house_id NOT NULL`** on every tenant table: `tables`, `reservations`, `settings`, `house_ops`, `house_closures`, `contact_messages`, `menu_categories`, `dishes`, `ordering_settings`, `orders`, `order_items`, `checkout_intents`, `email_logs`, `event_banners`, `activity_log`. There is no "shared" row between houses except `site_settings` (brand-wide, owner-only).
2. **A row can never change house.** Trigger `private.forbid_house_change()` raises `house_immutable`.
3. **Cross-house references are impossible by construction.** Composite foreign keys carry the house:
   - `reservations (table_id, house) → tables (id, house)`
   - `dishes (category_id, house) → menu_categories (id, house)`
   - `order_items (order_id, house) → orders (id, house)` and `(dish_id, house) → dishes (id, house) ON DELETE SET NULL (dish_id)`
4. **Identity lives in `public.staff_members`** (`user_id`, `role staff|owner`, `house`, `active`). CHECK: `owner ⇒ house IS NULL`, `staff ⇒ house IS NOT NULL`. This table is the **only** thing RLS trusts.
   - Never authorize from `user_metadata`. Never authorize in SQL from the JWT copy either.
   - Trigger `private.sync_staff_claims()` mirrors `role` and `house` into `auth.users.raw_app_meta_data`, so Next.js `proxy.ts` can route instantly from `getClaims()` (`app_metadata.role`, `app_metadata.house`). Deactivated staff get `app_metadata.role = 'disabled'`. The DB still re-checks `staff_members.active` on every query, so deactivation is immediate for data even before the JWT refreshes.
5. **One staff scope expression, everywhere** (init-plan cached, fast):
   ```sql
   (select private.is_owner()) or house = (select private.current_staff_house())
   ```
   Helpers in schema `private` (SECURITY DEFINER, `search_path = ''`): `is_service_role()`, `current_staff_role()`, `current_staff_house()`, `is_owner()`, `is_staff()`, `can_access_house(house)`.
6. **Guests never touch tables directly.** The public site uses either anon-safe RPCs (`get_availability`, `get_ordering_status`, returning no personal data) or Next.js route handlers holding the **secret key** (service role). Every secret-key query in app code must filter `.eq('house', house)` with a house validated against the enum.
7. **The secret key bypasses RLS but not triggers, constraints or RPC checks.** That is why rules live in the database: overlap (exclusion constraint), opening rules, ordering rules, price computation, status machines.

---

## 2. Before you change anything (audit the live project)

Run these read-only queries in the SQL editor and paste the results into your reply before migrating:

```sql
-- existing objects
select table_name, column_name, data_type, is_nullable, column_default
  from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position;
select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) args, pg_get_function_result(p.oid) result
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public','private');
select schemaname, tablename, policyname, cmd, roles, qual from pg_policies where schemaname in ('public','storage');
select viewname, definition from pg_views where schemaname = 'public';
select typname, array_agg(enumlabel order by enumsortorder) from pg_enum e join pg_type t on t.oid = e.enumtypid group by 1;

-- the exclusion constraint will fail if overlapping active reservations already exist
select a.id, b.id, a.table_id, a.service_date, a.start_time, b.start_time
  from public.reservations a join public.reservations b
    on a.table_id = b.table_id and a.id < b.id and a.service_date = b.service_date
   and a.status in ('held','blocked','confirmed') and b.status in ('held','blocked','confirmed')
   and tsrange(a.service_date + a.start_time, a.service_date + a.start_time + make_interval(mins => a.hold_minutes))
    && tsrange(b.service_date + b.start_time, b.service_date + b.start_time + make_interval(mins => b.hold_minutes));
```

If the overlap query returns rows, **stop** and list them; staff must release one of each pair first. If `start_time` is not `time` or `hold_minutes` is not `integer`, stop and report; do not cast silently.

Take a backup (`supabase db dump -f backup_before_multi_house.sql --data-only` plus schema) before applying.

---

## 3. Apply

1. Dashboard → Database → Extensions: enable **`btree_gist`** and **`pg_cron`** (the migration creates `btree_gist` itself; `pg_cron` must be enabled once by the owner).
2. `supabase migration new multi_house` → paste the full content of `supabase/reference/momo_house_multi_house.sql` → `supabase db push`. (Or run it in the SQL editor in one go; it is idempotent.)
3. Run it **a second time** to prove idempotency. It must finish without error.
4. Run `supabase/tests/tenant_isolation_test.sql` in the SQL editor. Expected: 68 `ok:` notices, no error, nothing persisted (it ends with `rollback`).
5. `supabase gen types typescript --project-id qhwmjyzzeggyoktdmqtt --schema public > src/lib/supabase/database.types.ts` (use the repo's existing path if one exists).
6. Dashboard → Authentication:
   - **Disable "Allow new users to sign up"**. There are no customer accounts. Staff accounts are created only by script / owner.
   - Minimum password length 12. Enable leaked-password protection if the plan allows it.
   - Site URL = production URL. Redirect URLs: `https://<prod>/admin/reinitialiser`, `http://localhost:3000/admin/reinitialiser`, and Vercel preview wildcard if used.
   - Custom SMTP through Resend so reset e-mails come from the brand domain.

What the migration does, section by section (numbers match the SQL file):

| § | What |
| --- | --- |
| 0 | `btree_gist`, `pgcrypto`, schema `private` (no anon access) |
| 1 | Enums. Contract enums untouched: `house_id`, `table_zone`, `reservation_status`. New: `staff_role`, `closure_scope`, `order_status`, `fulfillment_type`, `payment_method`, `payment_status`, `checkout_intent_status`, `email_status` |
| 2 | `private.set_updated_at()`, `private.forbid_house_change()` |
| 3 | `staff_members` + auth helpers + claims mirror trigger |
| 4 | `house_ops` (+ display_name, address, contact_email, email_from_name, closed_weekdays ISO 1–7), `site_settings`, `settings` (+ reservations_enabled, max_party_size, min_lead_minutes, booking_horizon_days, confirm/cancel templates), `house_closures` |
| 5 | `tables` (+ sort_order, unique `(id, house)`), `reservations` (+ source, created_by, confirmed_at/by, cancelled_at, cancel_token, updated_at, deleted_at, **generated `slot tsrange`**, composite FK, **exclusion constraint `reservations_no_overlap`**) |
| 6 | `contact_messages` (+ handled_by, updated_at, deleted_at) |
| 7 | `menu_categories`, `dishes` (prices in **cents**, EU allergens, tags, spice, featured) |
| 8 | `ordering_settings`, `orders`, `order_items`, `checkout_intents`, per-house daily order numbers `M260924-001` / `P260924-001`, order status & payment guards |
| 9 | `email_logs` (idempotency index), `event_banners`, `activity_log` + trigger |
| 10 | updated_at / house-immutable / activity triggers on every table |
| 11 | Opening rules: `house_closed_on`, `house_accepting_orders_at`, `assert_ordering_open` |
| 12 | Reservation RPCs (contract names and argument lists kept) + `set_reservation_table` + `get_availability` |
| 13 | Checkout RPCs: `quote_order`, `create_order` (atomic, idempotent), `get_ordering_status` |
| 14 | Reports: `report_summary`, `monthly_report` (SECURITY INVOKER + house check) |
| 15 | `purge_trash(35)` |
| 16 | `public.*` wrappers (PostgREST only exposes `public`) |
| 17 | EXECUTE revoked from PUBLIC/anon on everything in `private`; explicit grants |
| 18 | Views `admin_service_board`, `admin_dashboard_today` recreated **with `security_invoker = true`** |
| 19 | Column-level UPDATE grants (defense in depth) |
| 20 | RLS: every existing policy on managed tables is dropped and replaced by the matrix below |
| 21 | Storage buckets `dish-images`, `event-banners`, per-house folder policies |
| 22 | Realtime publication: `reservations`, `orders`, `contact_messages`, `email_logs` |
| 23 | pg_cron jobs `momo_purge_trash` (03:15 UTC) and `momo_expire_checkout_intents` (every 30 min) |
| 24 | Seeds with `ON CONFLICT DO NOTHING`: both `house_ops`, `site_settings`, `settings` with time slots, `ordering_settings` (both **off**), 8 salle + 4 terrasse tables per house, 5 menu categories per house |

**Important about views:** the old `admin_service_board` / `admin_dashboard_today` were almost certainly created without `security_invoker`, which means they ran with the view owner's rights and **bypassed RLS** — a Montmartre login could read Poissonnière guests through the view. The migration drops and recreates both with `security_invoker = true`. Any view you add later must also use `with (security_invoker = true)`.

---

## 4. Table reference (who reads, who writes)

| Table | anon (public site) | staff of house H | owner | service role (secret key) |
| --- | --- | --- | --- | --- |
| `staff_members` | — | read own row | read all | create / update (script, Équipe page) |
| `house_ops` | read | update H | update any | — |
| `site_settings` | read `contact_email` | read | update | — |
| `settings` | — | read/update H | any | read (emails, availability) |
| `house_closures` | read | CRUD H | any | read |
| `tables` | read active | read, insert, update H (no delete: deactivate) | any | read |
| `reservations` | — (use `get_availability`) | read H; update guest_name/phone/email/note/guests/deleted_at; delete only if trashed; insert/status/duration/table only via RPC | any | via `place_hold` (held only), guest cancel via `set_reservation_status(…,'cancelled')` |
| `contact_messages` | — | read H; update status/handled_by/deleted_at; purge trashed | any | insert (`/api/contact`) |
| `menu_categories` | read active | CRUD H (delete blocked by FK if dishes exist) | any | read |
| `dishes` | read (active categories) | CRUD H | any | read |
| `ordering_settings` | read | update H | any | read |
| `orders` | — | read H; update status/payment_status/internal_note/cancel_reason/deleted_at (guarded); purge trashed | any | create via `checkout_create_order`; refunds |
| `order_items` | — | read H | any | via `checkout_create_order` |
| `checkout_intents` | — | — | — | only |
| `email_logs` | — | read H; trash/purge | any | insert/update |
| `event_banners` | read enabled & running today (Paris) | CRUD H | any | cron cleanup |
| `activity_log` | — | read H | any | written by triggers |

Storage (both buckets public-read by URL, 5 MB, jpeg/png/webp/avif): objects **must** live under `{house}/…` (`montmartre/dishes/<uuid>.webp`, `poissonniere/banners/<uuid>.webp`). Staff may list/insert/update/delete only in their house folder; owner in both.

---

## 5. RPC catalog (call these, never re-implement the rules in TypeScript)

| Function (`public.`) | Caller | Does |
| --- | --- | --- |
| `place_hold(p_house, p_table_id, p_date, p_start, p_hold_minutes, p_guests, p_name, p_phone, p_email, p_note, p_status)` → `reservations` | staff JWT (held or blocked, any time, own house) · secret key (guest: held only, enforces `reservations_enabled`, closures, `time_slots`, lead time, horizon, party size ≤ max and ≤ seats, name+phone) | Inserts. Overlap → `table_taken`. `p_hold_minutes` null → `settings.hold_minutes` (default 90). `source` = `web` for secret key, `staff` for staff |
| `set_hold_minutes(p_reservation_id, p_hold_minutes)` | staff | 15–360; overlap → `table_taken` |
| `set_reservation_status(p_reservation_id, p_status)` | staff; secret key only for `cancelled` (guest cancel link) | Machine: `held → confirmed/released/cancelled/no_show`, `confirmed → released/cancelled/no_show`, `blocked → released`; terminal otherwise. Sets `confirmed_at/by`, `cancelled_at` |
| `set_reservation_table(p_reservation_id, p_table_id)` | staff | Move to another active table of the same house; overlap → `table_taken` |
| `get_availability(p_house, p_date, p_guests)` → jsonb | anon, staff, secret | `{house, date, hold_minutes, enabled, closed, slots:[{time, past, tables:[{id, zone, number, seats, fits, free}]}]}` |
| `get_ordering_status(p_house)` → jsonb | anon | `{pickup:{open, reason}, delivery:{open, reason}, cash_on_pickup, prep_minutes, fees, discount, min, postcodes, eta, paused_until}` |
| `checkout_quote(p_house, p_fulfillment, p_items, p_payment_method, p_postcode)` → jsonb | **secret key only** | Validates opening rules, prices every line **from the DB**, takeaway discount on non-drinks, fees, delivery minimum. Returns `{lines, subtotal_cents, discount_cents, fee_cents, total_cents, …}` |
| `checkout_create_order(p_house, p_quote, p_customer, p_payment)` → `(order_id, order_number, created)` | **secret key only** | Atomic order + items. Idempotent on `payment_intent_id` (`created=false` on replay). Opening rules re-checked only for unpaid (cash) orders — a **paid** card order is always recorded. Flags `needs_review` if `p_payment.amount_cents ≠ total`. Marks the `checkout_intents` row completed |
| `report_summary(p_house, p_from, p_to)` → jsonb | staff/owner | Orders (count, revenue, avg basket, pickup/delivery, card/cash, distinct customers), reservations (status counts, covers, confirm rate), by_day, top_dishes, busiest_slots |
| `monthly_report(p_house, p_year, p_month)` → jsonb | staff/owner | summary + every order of the month (Paris calendar) |

`p_items` = `[{dish_id, quantity, notes?}]`. `p_customer` = `{name, phone, email, note?, requested_time?, delivery_address?: {line1, line2, postcode, city, instructions}}`. `p_payment` = `{method: 'card'|'cash', status?: 'paid'|'pending', payment_intent_id?, amount_cents?, stripe_payment_label?}`.

Staff updates to `orders` are guarded by trigger `private.orders_before_update`: forward-only status (cancel always allowed), no un-cancel, **a paid card order cannot be cancelled by a plain update** (`refund_required` — the server must refund through the house's Stripe account with the secret key first), card `payment_status` is locked (`payment_status_locked`), cash can be toggled `pending ⇄ paid` (encaisser / annuler l'encaissement). Timestamps `confirmed_at / ready_at / completed_at / cancelled_at / paid_at` are set automatically.

---

## 6. Error keys → French (create `src/lib/errors.ts`, shared by admin and public site)

RPCs raise stable English keys as the error **message** (errcode `P0001`, `42501` for permissions, `P0002` for not found). Map them; never show raw Postgres text to anyone.

| key | French copy |
| --- | --- |
| `table_taken` | Cette table est déjà prise sur ce créneau. |
| `forbidden_house`, `forbidden` | Accès refusé pour cette maison. |
| `not_found` | Élément introuvable (il a peut-être été supprimé). |
| `invalid_status_transition`, `invalid_status` | Ce changement de statut n’est pas possible. |
| `invalid_table` | Table inconnue ou désactivée. |
| `invalid_hold_minutes` | Durée invalide (entre 15 et 360 minutes). |
| `reservations_disabled` | Les réservations en ligne ne sont pas disponibles pour le moment. |
| `house_closed` | La maison est fermée ce jour-là. |
| `invalid_slot` | Ce créneau n’est pas proposé. |
| `slot_in_past` | Ce créneau est passé ou trop proche. Appelez-nous directement. |
| `date_too_far` | Cette date est trop lointaine pour réserver en ligne. |
| `party_size_invalid` | Nombre de couverts invalide. Pour un groupe, appelez-nous. |
| `party_too_large_for_table` | Cette table est trop petite pour votre groupe. |
| `guest_details_required` | Nom et téléphone obligatoires. |
| `ordering_disabled` | Les commandes en ligne ne sont pas disponibles pour le moment. |
| `ordering_paused` | La cuisine fait une courte pause. Réessayez dans quelques minutes. |
| `takeaway_disabled` | Le retrait n’est pas disponible pour le moment. |
| `delivery_disabled` | La livraison n’est pas disponible pour le moment. |
| `cash_not_allowed_for_delivery` | Le paiement en espèces n’est pas disponible pour la livraison (carte en ligne uniquement). |
| `cash_disabled` | Le paiement en espèces n’est pas disponible. |
| `delivery_postcode_not_served` | Nous ne livrons pas encore ce code postal. |
| `outside_service_hours` | Nous ne prenons pas de commande en dehors des heures de service. |
| `empty_cart` | Votre panier est vide. |
| `dish_not_found`, `dish_unavailable` | Un plat n’est plus disponible : {detail}. |
| `invalid_quantity` | Quantité invalide. |
| `delivery_minimum_not_met` | Minimum de commande pour la livraison : {min}. |
| `refund_required` | Commande payée par carte : utilisez « Annuler et rembourser ». |
| `payment_status_locked` | Le paiement par carte est géré par Stripe. |
| `house_immutable`, `house_mismatch`, `quote_mismatch`, anything else | Une erreur est survenue. Réessayez ou appelez la maison. (log the raw error server-side) |

---

## 7. Staff accounts (script, not UI signup)

Create `scripts/create-staff.ts` (run with `npx tsx scripts/create-staff.ts --email … --role staff --house montmartre --name "…"`):

```ts
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

// parse --email --role (staff|owner) --house (montmartre|poissonniere, staff only) --name
// validate: role owner ⇒ no house; role staff ⇒ house in the enum
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const password = randomBytes(12).toString("base64url"); // printed once, owner changes it via reset
const { data, error } = await admin.auth.admin.createUser({
  email, password, email_confirm: true,
  app_metadata: role === "owner" ? { role } : { role, house },
});
// then: insert into staff_members (user_id, role, house, display_name) — the trigger re-syncs app_metadata
```

Create exactly three accounts to start: one `staff` for `montmartre`, one `staff` for `poissonniere`, one `owner`. Use the env variable names already present in `.env.local` (do not rename them; if the secret key is called differently there, use that name).

---

## 8. Environment variables (add missing ones to `.env.example`, never commit values)

| Variable | Used by |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or existing anon key name) | browser + server clients |
| `SUPABASE_SECRET_KEY` (or existing service key name) | server only (`import "server-only"`) |
| `STRIPE_SECRET_KEY_MONTMARTRE`, `STRIPE_SECRET_KEY_POISSONNIERE` | each owner has **their own Stripe account**; money never goes to the other house |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_MONTMARTRE`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_POISSONNIERE` | checkout Payment Element |
| `STRIPE_WEBHOOK_SECRET_MONTMARTRE`, `STRIPE_WEBHOOK_SECRET_POISSONNIERE` | `/api/webhooks/stripe/[house]` |
| `RESEND_API_KEY`, `EMAIL_FROM_DOMAIN` | e-mails (sender `montmartre@<domain>` / `poissonniere@<domain>`) |
| `CRON_SECRET` | `/api/cron/daily` |
| `NEXT_PUBLIC_SITE_URL` | links in e-mails |

If a house has no Stripe keys, online card ordering for that house is simply unavailable; the admin shows why.

---

## 9. Jobs

- **pg_cron (SQL only):** `momo_purge_trash` hard-deletes rows trashed more than 35 days ago (reservations, orders, email_logs, contact_messages) and stale non-completed `checkout_intents` > 30 days; `momo_expire_checkout_intents` labels pending intents older than a day `expired` (a late Stripe webhook can still finalize them).
- **Storage cleanup cannot run in SQL**: Supabase blocks direct `DELETE` on `storage.objects`. Expired event-banner images and their rows are removed by the Next.js route `/api/cron/daily` via the Storage API (see the admin prompt). If pg_cron is unavailable, that same route calls `purge_trash` too.

---

## 10. Conventions for any future migration

- `supabase migration new <name>`; never hand-invent timestamps; never edit an applied migration.
- Every new tenant table: `house public.house_id not null`, RLS enabled, the scope expression from §1.5 in every staff policy, `forbid_house_change` + `set_updated_at` triggers, composite FK when it references another tenant table.
- Every new function: `set search_path = ''`, fully qualified names, `revoke all … from public, anon`, explicit grants. SECURITY DEFINER only in `private`, and it must check `private.can_access_house()` (or `is_service_role()`) itself.
- Every new view: `with (security_invoker = true)`.
- Money is integer cents. Dates are `date`; service times are `time`; "today" is always `(now() at time zone 'Europe/Paris')::date`.
- Soft delete = `deleted_at`. Lists always filter `deleted_at is null`.

## 11. Do not

- Do not create a second Supabase project, a second schema per house, or `_montmartre` / `_poissonniere` table copies.
- Do not add a `users`/`profiles` table with customer accounts, and do not re-enable signups.
- Do not read roles from `user_metadata`, and do not make SQL trust `auth.jwt() -> app_metadata`.
- Do not grant anon access to `reservations`, `orders`, `settings`, `email_logs`, `contact_messages`, `checkout_intents`.
- Do not rename contract objects: `house_id`, `table_zone`, `reservation_status`, `tables`, `reservations`, `settings`, `house_ops`, `site_settings`, `contact_messages`, `place_hold`, `set_hold_minutes`, `set_reservation_status`, `admin_service_board`, `admin_dashboard_today`.
- Do not insert an `orders` row when a PaymentIntent is created. Card orders exist only after Stripe `succeeded`.
- Do not store prices in euros as floats.

## 12. Acceptance (all must be true)

- [ ] Audit results posted; overlap query returned 0 rows (or conflicts resolved by staff first).
- [ ] Migration applied, then re-applied with no error.
- [ ] `tenant_isolation_test.sql`: 68 × `ok:`, 0 errors, 0 rows left behind.
- [ ] `select * from pg_views where viewname like 'admin_%'` → both views show `security_invoker=true` in `reloptions` (`select relname, reloptions from pg_class where relname like 'admin_%'`).
- [ ] Signups disabled; three staff accounts exist; each has matching `app_metadata` (`role`, `house`).
- [ ] Logged in as Montmartre in the browser console: `supabase.from('reservations').select('house')` returns only `montmartre`; `supabase.from('orders').update({internal_note:'x'}).eq('house','poissonniere')` updates 0 rows; uploading to `dish-images/poissonniere/x.webp` fails.
- [ ] `database.types.ts` regenerated and committed.
- [ ] `pg_cron` jobs listed in `cron.job` (or a note explaining that the daily route handles them).
