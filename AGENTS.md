<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Learned User Preferences

- Avoid generic template-looking UI; pages should match the established Momo House visual theme and feel polished.
- Prefer fluid site-wide motion matching the homepage: dual-house portal hover, page transitions, hover/click feedback, and the same reveal/stagger language on reservation, carte, about, and contact for both houses.
- Main site header should emphasize the two houses (Poissonnière | Montmartre); La Carte is in the main navigation and the footer, and on each house.
- Header branding: use the provided wordmark/logo assets, blend the logo background into the header color so only the text reads, keep the full logo image visible, and treat the iconic brand photo as a signature visual.
- Public reservation opens the Zenchef booking module; do not present a fake confirmed booking from the site.

## Learned Workspace Facts

- Next.js marketing site for Momo House Paris (Nepalese/Tibetan streetfood) with two maisons: Montmartre and Poissonnière.
- Primary design source is the Figma file "Actual-Design" (`dvNz3qw19njXgR9Re5Ig7f`).
- This workspace deploys to `momo-house-new-design.vercel.app`; `momohouse.fr` is attached to that project (`www` redirects to the apex). `momohouseresto.vercel.app` is a different project (`MomoHouse-Resto`) and should not be treated as this repo.
- House pages share the same structure. The menu is one shared French flipbook (`react-pageflip`) at `/carte`, `/montmartre/carte`, and `/poissonniere/carte` (same carte for both maisons; page-turn sound removed). Reservations live at `/reservation` with house selection via `?maison=`.
- House pages use `heroImage`, `mapsEmbedUrl`, and `mapsUrl` from `lib/houses`. Static dish grids (homepage Incontournables and house specialty filters) were removed in favor of the flipbook.
- Contact is a dual-house page built from `lib/houses`. Public booking is the Zenchef widget; Poissonnière shares Montmartre’s module until a second Zenchef restaurant ID is set.
