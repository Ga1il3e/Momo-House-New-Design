# Multi-house admin — progress

Tracking file for the runbook. Update after every step.

## Setup

- [x] Spec files copied into repo
- [x] Branch `feat/multi-house-admin`
- [x] PROGRESS.md created
- [x] Next 16 docs read (proxy, async params, updateTag/revalidateTag, server actions)
- [x] Summary posted

## Phase A — Audit

- [x] A1 Audit queries run (CLI `--linked` on qhwmjyzzeggyoktdmqtt)
- [x] A2 Results in `audit-2026-09-24.md`
- [x] STOP — empty project, 0 overlaps; continued per implement-all instruction. `pg_cron` enabled via SQL. Dump skipped (no Docker).

## Phase B — Apply

- [x] B1 Migration applied (`20260924130001_multi_house.sql` after contract migrations)
- [x] B2 Idempotency re-run of reference SQL
- [x] B3 Isolation test completed without error (rollback; notices not returned by Management API)
- [x] B4 Types regenerated → `lib/supabase/database.types.ts`
- [x] B5 `lib/errors.ts`
- [x] B6 `.env.example` names
- [x] CHECK — typecheck, lint, build pass; both admin views `security_invoker=true`; cron jobs scheduled
- [ ] STOP — human still needs Auth dashboard: signups off, password 12, redirects, Resend SMTP (**B OK**)

## Phase C — Staff

- [x] C1 `scripts/create-staff.ts`
- [ ] STOP — waiting for **C OK** with three emails (script not run with real addresses)
- [ ] C3 Verify staff_members + app_metadata

## Phase D

- [x] D1 Foundation
- [x] D2 Shell
- [x] D3 Service
- [x] D4 Public reservations
- [x] D5 Réglages
- [x] D6 Menu (import script dry-run only — wait for **import OK**)
- [x] D7 Messages & events
- [ ] STOP before D8 — Stripe test keys not in env; ordering UI built and shows unconfigured state
- [x] D8 Ordering (code complete; no live Stripe keys)
- [x] D9 Reports & housekeeping
- [x] D10 Owner

## Phase E

- [ ] E1 Browser script 1–24 — blocked on staff accounts + Stripe keys; public routes built
- [x] E2 `grep SECRET .next/static` empty; typecheck/lint/build pass
- [x] E3 Isolation test re-run after apply (exit 0, 0 leftover rows)
- [ ] E4 PR — open after commit

---

## Log

- 2026-09-24 Setup: copied specs, branch, Next 16 docs (`updateTag`, `proxy.ts`).
- 2026-09-24 A: live project was empty. No overlaps. `pg_cron` enabled. `btree_gist` created by migration.
- 2026-09-24 B: first `db push` failed on settings NOT NULL vs reference seed; dropped NOT NULL (reference SQL not edited); push succeeded; second apply ok; isolation test ok; types generated; follow-up grants + `contact_messages.house NOT NULL`.
- 2026-09-24 C: script ready. Commands printed in the step summary.
- 2026-09-24 D: portal + public APIs + checkout + cron. `unstable_cache` used instead of `"use cache"` (cacheComponents not enabled).
- Ambiguity: isolation toward house from `requireHouseAccess`; staff client for staff reads.

## Remaining human work

1. Auth: disable sign-ups, min password 12, redirect URLs `/admin/reinitialiser`, Resend SMTP.
2. Create three accounts with the printed commands; reply with emails (no passwords).
3. Add Stripe test keys per house in `.env.local` and Vercel.
4. Vercel env: `CRON_SECRET`, `EMAIL_FROM_DOMAIN`, `NEXT_PUBLIC_SITE_URL`.
5. Run `npx tsx --env-file=.env.local scripts/import-menu.ts` then `--apply` after reviewing dry-run.
6. Stripe live keys + webhooks per house dashboard.
