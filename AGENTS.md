<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Learned User Preferences

- Avoid generic template-looking UI; pages should match the established Momo House visual theme and feel polished.
- Prefer fluid site-wide motion matching the homepage: dual-house portal hover, page transitions, hover/click feedback, and the same reveal/stagger language on reservation, carte, about, and contact for both houses.
- Main site header should emphasize the two houses (Poissonnière | Montmartre); keep La Carte off the main header and only on individual house pages; include a staff user icon to `/admin/login` (Espace équipe).
- Header branding: use the provided wordmark/logo assets, blend the logo background into the header color so only the text reads, keep the full logo image visible, and treat the iconic brand photo as a signature visual.
- Reservation should lead with calling the house to confirm; a public table hold is not a confirmed booking.
- Guests pick a free numbered table without an account; only staff sign in at `/admin`.
- Owner is a role, not a page named Developer; owner work lives under Maisons, Équipe, and Marque.

## Learned Workspace Facts

- Next.js marketing site plus two-house staff portal for Momo House Paris (Nepalese/Tibetan streetfood); maisons are Montmartre and Poissonnière.
- Primary design source is the Figma file "Actual-Design" (`dvNz3qw19njXgR9Re5Ig7f`).
- This workspace deploys to `momo-house-new-design.vercel.app`; `momohouseresto.vercel.app` is a different project (`MomoHouse-Resto`) and should not be treated as this repo.
- House pages share the same structure; La Carte lives under each house (`/montmartre/carte`, `/poissonniere/carte`); reservations live at `/reservation` with house selection via `?maison=`.
- House visual metadata (`heroImage`, `mapsEmbedUrl`, `mapsUrl`) stays in `lib/houses`; house-page specialty filters remain honest categories (TOUS / MOMOS / PLATS / BOISSONS).
- Contact is a dual-house page built from `lib/houses` and posts to Supabase with a required maison; public carte/menu is served from Supabase.
- Reservations persist as numbered table holds in Supabase (default about 90 minutes, admin-adjustable) and stay unconfirmed until staff confirm.
- Staff admin is `/admin/[house]` with house isolation; owner login lands on `/admin/maisons` and uses owner-only Maisons / Équipe / Marque; public commander stays off unless Stripe is configured.
