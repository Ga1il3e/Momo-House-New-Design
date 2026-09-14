<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Learned User Preferences

- Avoid generic template-looking UI; pages should match the established Momo House visual theme and feel polished.
- Prefer fluid site-wide motion: dual-house portal hover, page transitions, and hover/click feedback.
- Main site header should emphasize the two houses (Poissonnière | Montmartre); keep La Carte off the main header and only on individual house pages.
- Header branding: use the provided wordmark/logo assets, blend the logo background into the header color so only the text reads, keep the full logo image visible, and treat the iconic brand photo as a signature visual.

## Learned Workspace Facts

- Next.js marketing site for Momo House Paris (Nepalese/Tibetan streetfood) with two maisons: Montmartre and Poissonnière.
- Primary design source is the Figma file "Actual-Design" (`dvNz3qw19njXgR9Re5Ig7f`).
- House pages share the same structure; La Carte lives under each house (`/montmartre/carte`, `/poissonniere/carte`); reservations live at `/reservation` with house selection.
