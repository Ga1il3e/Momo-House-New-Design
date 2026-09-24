# RUNBOOK PROMPT — Execute the Momo House multi-house build, in order

> Paste this into Cursor (Agent mode). Before pasting, put the four files in the repo exactly here:
>
> | File | Path in repo |
> | --- | --- |
> | `01_MOMO_HOUSE_DATABASE_PROMPT.md` | `docs/momo-admin/01_MOMO_HOUSE_DATABASE_PROMPT.md` |
> | `02_MOMO_HOUSE_ADMIN_PORTAL_PROMPT.md` | `docs/momo-admin/02_MOMO_HOUSE_ADMIN_PORTAL_PROMPT.md` |
> | `momo_house_multi_house.sql` | `supabase/reference/momo_house_multi_house.sql` |
> | `tenant_isolation_test.sql` | `supabase/tests/tenant_isolation_test.sql` |

---

## Your job

You will build the Momo House two-house system (Montmartre + Poissonnière: same interface and logic, fully separate data, hidden owner role) by executing the specification files above **in order, phase by phase, with gates**. You do not design anything new. The files are the specification; this runbook is the order of execution.

### Before anything else
1. Read these four files **completely**, top to bottom. Do not skim. Then read `AGENTS.md` / `.cursor/rules` if they exist, `package.json`, `.env.local` (variable **names** only — never print values), `proxy.ts`, `SiteShell`, the `/admin` stubs, `/reservation`, `/api/availability`, `/api/reservations`, the house pages, and wherever the menu, hours and phones are hard-coded.
2. Read `node_modules/next/dist/docs/` for the installed Next.js 16 APIs you will use (proxy, async params, caching/revalidation, server actions).
3. Create branch `feat/multi-house-admin`.
4. Create `docs/momo-admin/PROGRESS.md` with one checkbox per phase/step below. Update it after every step: what you did, files touched, commands run, results, open questions. This file is how the human follows you.
5. Reply with a short summary: what already exists, what conflicts with the specs, which env variable names are present, and how you will run SQL against Supabase (see "Database access" below). Then start Phase A.

### Order of authority when things disagree
`supabase/reference/momo_house_multi_house.sql` > `01_MOMO_HOUSE_DATABASE_PROMPT.md` > `02_MOMO_HOUSE_ADMIN_PORTAL_PROMPT.md` > existing code.
Never edit the reference SQL silently. If you think it is wrong, stop, explain, and wait.

### Database access (pick the first that works, say which one you use)
1. Supabase MCP connected to project `qhwmjyzzeggyoktdmqtt` → use it for read-only queries and migrations.
2. Supabase CLI linked to the project (`supabase link --project-ref qhwmjyzzeggyoktdmqtt`) → `supabase db push`, `supabase gen types`.
3. Neither → write the exact SQL into a file under `supabase/manual/`, tell the human to run it in the Supabase SQL editor, and **wait** for them to paste the result.

### Gates
- 🛑 **STOP** = stop and wait for the human to reply. Do not continue on your own.
- ✅ **CHECK** = run the listed commands; continue only if all pass. If something fails twice, stop and report.
- Never run destructive SQL (`drop table`, `delete`, `truncate`) against the live project except what the reference migration itself does.
- Never print secrets. Never commit `.env*` values.
- Commit at the end of every step with a message `feat(admin): <phase/step> …`.

---

## Phase A — Audit the live database (prompt 1, §2)

A1. Run every read-only audit query from `01_…DATABASE_PROMPT.md` §2 (columns, functions, policies, views, enums, **overlap check**).
A2. Save the results to `docs/momo-admin/audit-<date>.md` and summarise in chat: differences from the contract, existing overlaps, any `start_time`/`hold_minutes` type mismatch.

🛑 **STOP.** Ask the human to:
- resolve any overlapping reservations you listed (release one of each pair),
- enable **`pg_cron`** (Dashboard → Database → Extensions),
- take a backup (or confirm they accept that you run `supabase db dump`),
- then reply **"A OK"**.

## Phase B — Apply the database (prompt 1, §3)

B1. `supabase migration new multi_house`, paste the full reference SQL unchanged, apply it.
B2. Apply it a **second** time (or run it again in the SQL editor) to prove idempotency.
B3. Run `supabase/tests/tenant_isolation_test.sql`.
B4. Regenerate types into the repo's types path.
B5. Create `src/lib/errors.ts` exactly from prompt 1 §6.
B6. Add missing variable names to `.env.example` from prompt 1 §8 (names only).

✅ **CHECK:** migration ran twice without error · test shows **68 `ok:`** and no error · both admin views have `security_invoker=true` · typecheck passes.

🛑 **STOP.** Ask the human to (Supabase dashboard → Authentication): **disable sign-ups**, set min password length 12, add redirect URLs `/admin/reinitialiser` (prod + localhost), configure SMTP via Resend. Reply **"B OK"**.

## Phase C — Staff accounts (prompt 1, §7)

C1. Write `scripts/create-staff.ts`.
C2. Do **not** run it yourself with real e-mails. Print the three commands for the human (Montmartre staff, Poissonnière staff, owner).

🛑 **STOP.** Human runs them, stores the passwords, replies **"C OK"** with the three e-mails (no passwords).
C3. Verify with a read-only query that the three `staff_members` rows exist and `auth.users.raw_app_meta_data` has matching `role`/`house`.

## Phase D — Admin portal and site integration (prompt 2), one step at a time

After **every** step: ✅ `typecheck` + `lint` + `build` pass, run the browser checks listed for that step (from prompt 2 §11), update `PROGRESS.md`, commit. If the dev server is needed, run it and use the browser to verify; if you cannot open a browser, list the exact manual checks for the human.

| Step | Build (prompt 2 sections) | Browser checks (§11) |
| --- | --- | --- |
| D1 Foundation | §3 file map skeleton, `lib/house.ts`, Supabase clients (browser/server/admin with `server-only`), `lib/auth/staff.ts`, `lib/time.ts`, `lib/money.ts`, `lib/status.ts`, `proxy.ts` rules (§4), login + password reset pages, `/admin` redirect, legacy `/admin/tables` & `/admin/settings` redirects | 1, 2, 3 |
| D2 Shell | §5 AdminShell, sidebar, owner HouseSwitcher, badges, `useHouseLive` realtime + toasts, `[house]/layout.tsx` with `requireHouseAccess`; §8 e-mail module (server-only, logging, idempotency, "skipped" when no Resend) | 2, 3 again + owner switcher keeps the sub-path |
| D3 Service | §6.1 Retenues (list + frise + all actions + phone booking + block + drawer/history), §6.2 Réservations, §6.3 Tables | 8, 9, 10, 11 |
| D4 Public reservations | §7.1 house data from `house_ops`, §7.3 availability + reservations APIs + honest success copy + guest cancel link, §7.4 contact | 4, 7, 12, 16 |
| D5 Réglages | §6.11 all four tabs incl. closures and e-mail templates with preview/test | 13 |
| D6 Menu | §6.5 Carte (categories, dishes, photos, allergens, signatures, owner copy), `scripts/import-menu.ts` (run it only after showing the human the dry-run output — 🛑 wait for "import OK"), §7.2 public menu from DB, remove hard-coded menu | 14 |
| D7 Messages & events | §6.7 Messages, §6.6 Événements, §7.6 popup, §7.7 `/api/cron/daily` + `vercel.json` | 15, 16 |
| D8 Ordering | §6.4 Commandes, §7.5 per-house cart/checkout, `lib/stripe.ts`, `finalizePaidOrder`, all checkout APIs, per-house webhooks, `/commande/[token]` | 17–22 |
| D9 Reports & housekeeping | §6.8 Rapports + mensuel, §6.9 E-mails journal, §6.10 Corbeille | 23, 24 |
| D10 Owner | §6.12 Maisons, Équipe, Marque | 5, 6 |

🛑 **STOP before D8.** Ask the human for Stripe **test** keys for each house (publishable, secret, webhook secret per house, in `.env.local`) and whether both owners already have their own Stripe accounts. If a house has no keys, build D8 anyway; that house's ordering must show *Stripe n’est pas configuré pour cette maison* and stay off.

## Phase E — Final verification

E1. Run the full browser script, prompt 2 §11 steps 1–24, in two separate browsers (Montmartre vs Poissonnière) plus the owner. Record pass/fail for each in `PROGRESS.md`.
E2. Tick every item of prompt 1 §12 and prompt 2 §12. Run `grep -r "SECRET" .next/static` (must be empty).
E3. Re-run `supabase/tests/tenant_isolation_test.sql` against the live project (still 68 ok).
E4. Final reply: what was built, what passed, anything not done and why, what the human must still do (Stripe live keys, webhooks in each Stripe dashboard, Vercel env vars incl. `CRON_SECRET`, Resend domain verification). Open a PR from `feat/multi-house-admin`; do not merge.

---

## Rules for the whole run
- Follow the specs literally. No extra pages, features or libraries not named in the specs.
- One step at a time. Do not start the next step while the current one has a failing check.
- If a spec is ambiguous, pick the reading that keeps the two houses more isolated, note it in `PROGRESS.md`, and mention it in your step summary.
- If you run out of context mid-run, re-read this runbook, `PROGRESS.md`, and the relevant spec section before continuing.
- Keep answers to the human short: what you did, check results, what you need from them.

**Start now with "Before anything else", then Phase A.**
