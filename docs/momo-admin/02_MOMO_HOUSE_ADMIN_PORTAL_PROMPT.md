# MASTER PROMPT 2/2 — Momo House staff portal (two houses, one codebase) + website integration

> Paste into Cursor **after** prompt 1/2 (database) is applied and its test passes.
> Repo: the existing Next.js 16 site (https://momo-house-new-design.vercel.app). Supabase `qhwmjyzzeggyoktdmqtt`.

---

## 0. Your role and what to read first

You are building the **staff portal** of Momo House and wiring it deeply into the public website. Two houses, two owners, **one codebase, one interface, one set of rules, two completely separate datasets**:

- Montmartre staff log in with their own e-mail/password and land in **their** portal: `/admin/montmartre`.
- Poissonnière staff log in with theirs and land in `/admin/poissonniere`.
- Neither can see, count, receive realtime events from, or open the other house — even by typing the URL.
- A hidden **owner** account can open both and switch between them.

Before writing code, read:
1. `node_modules/next/dist/docs/` — this is **Next.js 16**: `proxy.ts` (not `middleware.ts`), async `params`/`searchParams`/`cookies()`, current caching and `revalidateTag` / `updateTag` signatures. Use what the docs in the installed version say, not memory.
2. Current `@supabase/ssr` docs: `createServerClient` with `getAll`/`setAll` cookies, `supabase.auth.getClaims()` for auth checks.
3. `supabase/reference/momo_house_multi_house.sql`, `src/lib/supabase/database.types.ts`, `src/lib/errors.ts` from prompt 1/2. **Do not re-implement in TypeScript any rule that an RPC already enforces** (overlap, opening hours, prices, status machines).
4. The existing public site: `SiteShell`, house pages `/montmartre` and `/poissonniere`, `/reservation`, `/contact`, the motion primitives `FadeIn`, `Stagger`, `HoverLift`, the Tailwind tokens (burgundy, paper), fonts Epilogue + Space Grotesk. Find where menu, hours and phones are currently hard-coded.

Do not invent a generic SaaS dashboard. Do not add features that are not in this prompt.

---

## 1. Product truths (copy these into your head)

| | Montmartre | Poissonnière |
| --- | --- | --- |
| Route slug / enum | `montmartre` | `poissonniere` |
| Order number prefix | `M` (e.g. `M260924-007`) | `P` |
| Address | 85 Rue Montmartre, 75002 | 46 Rue Poissonnière, 75010 |
| Phone | 01 42 33 89 10 | 01 40 26 11 84 |
| Service | 11h45–15h00 & 18h30–22h30 | 12h00–22h30 continu |
| Spaces | Salle boisée & terrasse de quartier | Grande terrasse |
| Stripe account | Montmartre owner's | Poissonnière owner's |

- **A reservation from the website is a hold, not a booking.** Status `held` means "table retenue, pas encore confirmée". Staff call the guest; pressing **Confirmer** is the house saying "we called, it's on". The public site must never say "confirmée" for a hold.
- Default hold (= seating) duration is **90 min**: a 19:30 hold frees the table at 21:00. Occupancy is `[start, start + hold_minutes)`. Active blockers: `held`, `blocked`, `confirmed`.
- Prices are integer **cents**. Display with `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`.
- "Today" is always **Europe/Paris**.
- UI copy is **French**, short, honest. If Resend is not configured, things still save and the UI shows *E-mail non envoyé* — never fake a sent e-mail.

---

## 2. Non-negotiables

1. **House comes from identity, not from the URL.** The URL segment `[house]` is only a view selector. Staff: if `params.house !== staff.house` → redirect to their own house. Owner: any valid house. Invalid slug → `notFound()`.
2. **Authorization = `getClaims()` + `staff_members`.** `app_metadata.role ∈ {'staff','owner'}` (and `app_metadata.house` for staff) is used by `proxy.ts` for fast routing. The admin layout then loads the caller's own `staff_members` row (RLS lets them read only their own) and requires `active = true`. **Never** read `user_metadata`. RLS in the database is the final guard; the app checks are for UX and early exit.
3. **Staff data access uses the logged-in staff client** (publishable key + session cookies) so RLS applies. The secret key is used **only** in: guest APIs (`/api/reservations`, `/api/reservations/cancel`, `/api/contact`, `/api/checkout/*`, `/api/orders/[token]`), Stripe webhooks, `/api/cron/daily`, the staff "Annuler et rembourser" action, the server-only e-mail module (it writes `email_logs`, which staff cannot insert), and owner-only team management. In the staff paths the secret key is used **after** `requireHouseAccess(house)` and only for the one write that needs it. Put it in `src/lib/supabase/admin.ts` with `import "server-only"`. Every secret-key query filters `.eq("house", house)` where `house` passed `isHouse()`.
4. **Inserts take the house from the verified context**, never from form data. Server actions receive the house from the route, call `requireHouseAccess(house)`, then write `{ ...data, house }`.
5. **Every realtime channel is house-scoped**: `filter: \`house=eq.${house}\``. RLS also filters, but do both.
6. **Exhaustive `switch`** on `reservation_status`, `order_status`, `fulfillment_type`, `payment_status` with a `never` default. Imports at the top of files. No inline imports.
7. **Payment-first card orders.** No `orders` row until Stripe says `succeeded` (webhook or confirm, same idempotent helper). Abandoned or failed payments leave nothing in the admin.
8. **Stripe per house.** Montmartre money goes to Montmartre's Stripe account, Poissonnière to Poissonnière's. Pick keys with `getStripe(house)`. A webhook for one house never finalizes the other's order (`metadata.house` must equal the route house).
9. **Emails are a server module, not a public endpoint.** No unauthenticated `/api/send-email`.
10. **Keep `SiteShell` hiding the public header/footer on `/admin`.** Admin has its own shell.

---

## 3. Architecture and file map

```
src/proxy.ts                               session refresh + /admin routing
src/lib/house.ts                           HOUSES, isHouse(), HOUSE_LABEL, HOUSE_PREFIX, house order
src/lib/supabase/{client,server,admin}.ts  browser / server (cookies) / secret (server-only)
src/lib/auth/staff.ts                      getStaff() (React cache), requireStaff(), requireHouseAccess(house), requireOwner()
src/lib/errors.ts                          RPC error key → French (from prompt 1/2)
src/lib/time.ts                            parisToday(), formatDateFr(), formatTime(), addMinutes()
src/lib/money.ts                           euro(cents), parseEuroToCents("12,50")
src/lib/status.ts                          label/colour for reservation_status & order_status (exhaustive)
src/lib/email/{send,templates,render}.ts   server-only e-mail module
src/lib/stripe.ts                          getStripe(house), getPublishableKey(house), stripeConfigured(house)
src/lib/orders/finalize.ts                 finalizePaidOrder(house, paymentIntentId)
src/lib/menu.ts                            getMenu(house) for public pages (cached, tag menu:{house})

src/app/admin/login/page.tsx
src/app/admin/mot-de-passe/page.tsx        request reset link
src/app/admin/reinitialiser/page.tsx       set new password (PKCE recovery)
src/app/admin/page.tsx                     redirect → /admin/{house} or /admin/maisons (owner)
src/app/admin/maisons/page.tsx             owner: both houses side by side
src/app/admin/equipe/page.tsx              owner: staff accounts
src/app/admin/marque/page.tsx              owner: site_settings.contact_email
src/app/admin/[house]/layout.tsx           requireHouseAccess + AdminShell (sidebar, realtime toasts, badges)
src/app/admin/[house]/page.tsx             Retenues (today board)
src/app/admin/[house]/reservations/page.tsx
src/app/admin/[house]/tables/page.tsx
src/app/admin/[house]/commandes/page.tsx
src/app/admin/[house]/carte/page.tsx
src/app/admin/[house]/evenements/page.tsx
src/app/admin/[house]/messages/page.tsx
src/app/admin/[house]/rapports/page.tsx
src/app/admin/[house]/rapports/mensuel/page.tsx
src/app/admin/[house]/emails/page.tsx
src/app/admin/[house]/corbeille/page.tsx
src/app/admin/[house]/reglages/page.tsx    tabs via ?onglet=reservations|commandes|horaires|emails
src/app/admin/[house]/**/actions.ts        server actions per page ("use server")
src/components/admin/*                     AdminShell, Sidebar, HouseSwitcher, StatusPill, ConfirmDialog, DataTable, EmptyState, PrintFrame

src/app/api/availability/route.ts          GET  → rpc get_availability
src/app/api/reservations/route.ts          POST → rpc place_hold (secret) + emails
src/app/api/reservations/cancel/route.ts   POST {token} → guest cancel
src/app/api/contact/route.ts               POST → contact_messages + house e-mail
src/app/api/checkout/[house]/quote/route.ts
src/app/api/checkout/[house]/intent/route.ts
src/app/api/checkout/[house]/confirm/route.ts
src/app/api/checkout/[house]/cash/route.ts
src/app/api/orders/[token]/route.ts        GET status / POST cancel (guest)
src/app/api/webhooks/stripe/[house]/route.ts
src/app/api/cron/daily/route.ts

src/app/(site)/[house]/commander/page.tsx          or under the existing house page folders; reuse one component for both
src/app/(site)/[house]/commander/paiement/page.tsx
src/app/(site)/commande/[token]/page.tsx           order tracking + cancel
src/app/(site)/reservation/annuler/page.tsx        guest cancel link
src/components/site/EventBannersPopup.tsx
scripts/import-menu.ts                              one-off: hard-coded menu → DB (both houses)
vercel.json                                         crons
```

Adapt folder names to the repo's existing structure (route groups, `src/` or not), keep the URLs.

The legacy stub routes `/admin/tables` and `/admin/settings` become redirects to `/admin/{house}/tables` and `/admin/{house}/reglages`.

---

## 4. Identity, routing and the two portals

### `src/lib/house.ts`
```ts
export const HOUSES = ["montmartre", "poissonniere"] as const;
export type House = (typeof HOUSES)[number];
export const isHouse = (v: unknown): v is House => typeof v === "string" && (HOUSES as readonly string[]).includes(v);
export const HOUSE_LABEL: Record<House, string> = { montmartre: "Montmartre", poissonniere: "Poissonnière" };
export const HOUSE_PREFIX: Record<House, "M" | "P"> = { montmartre: "M", poissonniere: "P" };
```

### `proxy.ts` (matcher `/admin/:path*`, plus whatever the site already matches)
1. Refresh the Supabase session with the SSR cookie pattern.
2. Public admin paths: `/admin/login`, `/admin/mot-de-passe`, `/admin/reinitialiser`.
3. No claims → `/admin/login?next=<path>`.
4. `role` not `staff`/`owner` (includes `disabled`) → sign out, `/admin/login?erreur=acces`.
5. `/admin` → staff: `/admin/{house}`; owner: `/admin/maisons`.
6. `/admin/{x}/…` where `x` is a house and the user is staff of another house → redirect to the same sub-path under their own house.
7. `/admin/maisons`, `/admin/equipe`, `/admin/marque` → owner only, else redirect to own house.

### `src/lib/auth/staff.ts` (server only)
- `getStaff()` (wrapped in React `cache`): `getClaims()`; if no claims → null; read own `staff_members` row; return `{ userId, email, role, house, displayName }` only if `active`.
- `requireHouseAccess(house)`: `isHouse` else `notFound()`; `getStaff()` else redirect login; staff of another house → redirect own house; returns `{ staff, house }`.
- `requireOwner()`.
- Every server action starts with one of these. Proxy is not the security boundary; this is (plus RLS).

### Login `/admin/login`
- Brand page on paper background, burgundy button, Epilogue title **Espace équipe**. If `?maison=montmartre|poissonniere` is present show *Momo House Montmartre* / *Poissonnière* under the title (cosmetic; the account decides where you land). Each owner bookmarks their own link.
- Fields *Adresse e-mail*, *Mot de passe*, button *Se connecter* / *Connexion…*, link *Mot de passe oublié ?*.
- Errors: *E-mail ou mot de passe incorrect.* · *Ce compte n’a pas accès à l’espace équipe.* (`?erreur=acces` or no staff row) · *Trop de tentatives. Réessayez dans quelques minutes.* (429) · *Connexion impossible pour le moment.* (network).
- Empty state when env is missing: *Supabase n’est pas configuré : ajoutez NEXT_PUBLIC_SUPABASE_URL et la clé publique dans .env.local.*
- Success → `next` if it is an `/admin` path the user may open, else `/admin`.
- Reset flow: `/admin/mot-de-passe` sends `resetPasswordForEmail` with `redirectTo = ${SITE_URL}/admin/reinitialiser`; always answer *Si ce compte existe, un lien vient d’être envoyé.* `/admin/reinitialiser` exchanges the code, asks the new password twice (min 12), then `/admin`.
- *Sortir* (sidebar) signs out and goes to `/admin/login`.

---

## 5. Admin shell

**Sidebar** (white on paper, burgundy active item, collapses to a drawer on mobile with *Ouvrir le menu* / *Fermer le menu*). Header: burgundy circle with **M** or **P**, *Momo House*, the house name. Owner only: **HouseSwitcher** (Montmartre / Poissonnière) that keeps the current sub-path.

| Label | Route (under `/admin/{house}`) | Badge |
| --- | --- | --- |
| Retenues | `` (index) | today's `held` count |
| Réservations | `/reservations` | — |
| Commandes | `/commandes` | `pending` orders (hidden if ordering is off and none pending) |
| Tables | `/tables` | — |
| Carte | `/carte` | — |
| Événements | `/evenements` | — |
| Messages | `/messages` | `new` messages |
| Rapports | `/rapports` (prefix match) | — |
| E-mails | `/emails` | failed in last 24 h |
| Corbeille | `/corbeille` | trashed count |
| Réglages | `/reglages` | — |
| *Owner:* Maisons · Équipe · Marque | `/admin/maisons`, `/admin/equipe`, `/admin/marque` | — |
| Sortir | button | — |

Badges come from one lightweight server query (`admin_dashboard_today` + two counts) refreshed by the realtime hook.

**Realtime hook `useHouseLive(house)`** — one channel `admin-${house}` with `postgres_changes` on `reservations`, `orders`, `contact_messages`, `email_logs`, each `filter: house=eq.${house}`. Ignore events during the first 2 s. On any event: `router.refresh()` (debounced 500 ms) and toast:

| Event | Toast |
| --- | --- |
| reservations INSERT `source = web` | *Nouvelle retenue* — {name} · {guests} pers. · {date} {start} · table {zone} {number} |
| reservations UPDATE → `cancelled` and not by me | *Retenue annulée par le client* — {name} |
| orders INSERT | *Nouvelle commande* {order_number} — {total} · {Retrait/Livraison} (+ optional chime, toggle *Son des commandes* stored in localStorage, try/catch) |
| orders UPDATE → `cancelled` with `cancelled_by = guest` | *Commande annulée par le client* — {order_number} |
| contact_messages INSERT | *Nouveau message* — {name} |
| email_logs INSERT/UPDATE `failed` | *E-mail non envoyé* — {type} → {to} |

Toasts use the existing toast system (or Sonner if none). Admin motion: `FadeIn` on page entry only; no animation on tables/rows; respect `prefers-reduced-motion`.

**Status pills** (`src/lib/status.ts`, exhaustive):

| reservation_status | Label | Style |
| --- | --- | --- |
| held | Retenue — à confirmer | amber |
| confirmed | Confirmée | green |
| blocked | Bloquée | ink/grey |
| released | Libérée | muted |
| cancelled | Annulée | burgundy outline |
| no_show | No-show | red |

| order_status | Label (pickup / delivery) |
| --- | --- |
| pending | Reçue |
| confirmed | Acceptée |
| preparing | En préparation |
| ready | Prête (à retirer / à livrer) |
| completed | Retirée / Livrée |
| cancelled | Annulée |

---

## 6. Pages

### 6.1 Retenues — `/admin/{house}` (the service board)

Purpose: run tonight's service.

- Header: *Retenues* · house name · date picker (default Paris today) with ‹ › and *Aujourd’hui*. Zone filter *Toutes / Salle / Terrasse*. Status filter chips.
- Counters (today from `admin_dashboard_today`, other dates computed from the board): *À confirmer* (held), *Confirmées*, *Bloquées*, *Couverts attendus*, *No-shows*, *Libérées*, *Annulées*.
- Two views, toggle *Liste* / *Frise*:
  - **Liste** from `admin_service_board` where `service_date = date`, sorted by start: columns **Table** (Salle 3), **Zone**, **Créneau** (19:30–21:00), **Couverts**, **Nom**, **Téléphone** (`tel:` link), **E-mail** (`mailto:`), **Statut**, **Note**, **Actions**.
  - **Frise**: rows = active tables grouped by zone, columns = 15-min steps from the house's first opening to closing; each reservation is a block spanning `[start, end)` coloured by status; click opens the same actions. Simple CSS grid, no library.
- Actions (exhaustive switch on status; each calls the RPC through a server action and maps errors with `errors.ts`):
  - `held`: **Confirmer (appel fait)** → `set_reservation_status confirmed` + confirmation e-mail if the guest left an e-mail · **Libérer** → `released` · **Annuler** (confirm dialog) → `cancelled` + cancellation e-mail · **No-show** → `no_show` · **Durée** → `set_hold_minutes` (60, 75, 90, 105, 120, 150, 180 or custom ≥ 15) · **Changer de table** → `set_reservation_table` (select lists free tables of the same house for that slot using `get_availability`).
  - `confirmed`: **Libérer** (table partie tôt) · Annuler · No-show · Durée · Changer de table.
  - `blocked`: **Débloquer** (`released`) · Durée.
  - `released` / `cancelled` / `no_show`: none except *Mettre à la corbeille*.
  - After an action with e-mail, show *E-mail envoyé* or *E-mail non envoyé* (never lie).
- **Nouvelle réservation (téléphone)** dialog: table (select), date, heure (any time), durée (default settings), couverts, nom, téléphone, e-mail, note → `place_hold(..., 'held')` with the staff client (source becomes `staff`). Offer *Confirmer tout de suite* checkbox that calls `confirmed` right after.
- **Bloquer une table** dialog: table, date, heure, durée, note → `place_hold(..., 'blocked')`.
- `table_taken` shows *Cette table est déjà prise sur ce créneau.* inline in the dialog.
- Detail drawer: all fields, editable guest name/phone/e-mail/note/couverts (plain update, RLS), and **Historique** from `activity_log` (who did what, when).
- Empty state: *Aucune retenue ce jour-là.*

### 6.2 Réservations — `/admin/{house}/reservations`
All dates. Filters: period (default today → +30 days, presets *Aujourd’hui / 7 jours / 30 jours / Passées*), status, search (name, phone, e-mail). Paginated 50. Same actions/drawer as 6.1. *Exporter CSV* (`reservations-{house}-{from}-{to}.csv`, UTF-8 BOM, `;` separator, French headers). Trash button → `deleted_at = now()`.

### 6.3 Tables — `/admin/{house}/tables`
Floor plan per zone (*Salle*, *Terrasse*): card grid of tables (number, seats, active). Seed is 8 salle + 4 terrasse per house.
- *Ajouter une table*: zone, numéro (unique per house+zone; show *Ce numéro existe déjà dans cette zone.*), places.
- Edit number / seats / zone / order.
- *Désactiver* (never delete). If the table has future `held/confirmed/blocked` reservations, show the count and block: *Déplacez d’abord les {n} retenues à venir.* with a link to them. *Réactiver* for inactive ones.

### 6.4 Commandes — `/admin/{house}/commandes`
- Top bar: ordering state for this house (*Retrait ouvert / fermé*, *Livraison ouverte / fermée*, *Pause jusqu’à 20:15*), buttons **Pause 30 min** / **Reprendre** (update `ordering_settings.paused_until`).
- Board columns: *Reçues* (pending), *Acceptées*, *En préparation*, *Prêtes*, then collapsible *Terminées aujourd’hui* and *Annulées aujourd’hui*. Filters: date, fulfillment, payment method, search (number, name, phone). Card shows number, time, requested time or *Dès que possible*, name, fulfillment, items count, total, payment chip (*Carte payée*, *Espèces — à encaisser*, *Espèces — encaissé*, *Remboursée*), and **Montant à vérifier** if `needs_review`.
- Actions: **Accepter** (→ confirmed, e-mail *commande acceptée* with ready time = now + prep_minutes), **En préparation**, **Prête** (e-mail: pickup *Votre commande est prête, à tout de suite !* / delivery *Votre commande part en livraison.*), **Retirée / Livrée** (completed, no e-mail), **Encaisser** (cash → paid) / *Annuler l’encaissement*, **Annuler** (cash or unpaid: reason required → cancelled + e-mail), **Annuler et rembourser** (paid card: server action → `requireHouseAccess` → Stripe refund with **this house's** key → secret-key update `status=cancelled, payment_status=refunded, refunded_cents, cancelled_by='staff', cancel_reason` → e-mail with *Le remboursement apparaîtra sous 5 à 10 jours ouvrés.*). The DB rejects a plain cancel of a paid card order (`refund_required`); surface that message if it ever happens.
- Detail drawer: lines with notes, subtotal, *Remise à emporter*, *Frais*, total, payment (*Carte — Visa ···· 4242*, Stripe reference), delivery address, customer note, **Note interne** (editable), history from `activity_log`.
- **Imprimer**: *Ticket cuisine* (80 mm: number, time, fulfillment, lines with quantities and notes, customer note — no prices) and *Facture* (A4: house legal block from `house_ops`, lines, totals, payment block, *TVA incluse*). Print via a hidden iframe; if blocked: *Autorisez les fenêtres pop-up pour imprimer.*
- When online ordering is off for this house and there are no orders, show a calm empty state linking to *Réglages → Commandes*.

### 6.5 Carte — `/admin/{house}/carte`
This house's menu only; it feeds the public menu of this house.
- **Catégories** panel: list with dish counts; add (name, name in Devanagari optional, slug auto from name, editable), rename, reorder (up/down buttons writing `display_order`), toggles *Active*, *Commandable en ligne*, *Boissons (hors remise à emporter)*; delete only when empty (else *Catégorie non vide*). Saving a dish **never** creates a category.
- **Plats** grid (24 per page), search by name, filters category / *Disponibles* / *Épuisés* / *Signatures*. Card: photo, name, price, pills.
- Dish form: *Nom*, *Nom népalais* (optional), *Catégorie* (select of this house's categories), *Prix (€)* (parse "12,50" → 1250), *Description*, *Piquant* (0 Doux · 1 Léger · 2 Épicé · 3 Très épicé), *Tags* (végétarien, vegan, halal, sans gluten, fait maison, signature), **Allergènes** (14 EU allergens as chips — mandatory information in France; show *Aucun allergène déclaré* when empty), *Disponible*, *Commandable en ligne*, *Signature* (star; max 6 per house, matching the six signature dishes on the house page — show *6 signatures maximum*), *Photo*.
- Photo: client-side resize to max 1600 px WebP (canvas), upload to `dish-images/{house}/dishes/{uuid}.webp` with the staff client, store `image_path` + public `image_url`; on replace or delete, remove the old object.
- Eye toggle = *Épuisé ce soir* (`available=false`). Delete = hard delete with confirm (order history keeps the name thanks to `order_items.dish_name`).
- After any change: revalidate the public tag `menu:{house}` (use the API the Next 16 docs specify for server actions).
- **Owner only**: *Copier la carte depuis {autre maison}* — copies categories and dishes (not photos' ownership: re-upload/copy objects into the target folder) into an empty target menu; refuses if the target already has dishes.

### 6.6 Événements — `/admin/{house}/evenements`
Temporary posters (*Soirée Dashain*, *Fermeture exceptionnelle*…).
- List: preview, title, dates, *Actif* toggle, *Aussi sur l’accueil* toggle, order, edit, delete.
- Form: image (required, resize ≤ 1600 px WebP, bucket `event-banners/{house}/banners/{uuid}.webp`), titre, texte, lien (http/https only), du / au (end ≥ start), actif, aussi sur l’accueil, ordre.
- Delete removes the Storage object too. Expired banners are cleaned by `/api/cron/daily`.

### 6.7 Messages — `/admin/{house}/messages`
Inbox of `contact_messages` for this house. Tabs *Nouveaux / Lus / Archivés*. Opening marks *read* (`handled_by = me`). Actions: *Répondre* (`mailto:` with `Re: {subject}`), *Appeler* (`tel:`), *Archiver*, *Corbeille*. Empty: *Aucun message.*

### 6.8 Rapports — `/admin/{house}/rapports` and `/rapports/mensuel`
- Period: *7 derniers jours* (default), *30 derniers jours*, *Ce mois*, *Mois dernier*, *Personnalisé*. Data: `report_summary(house, from, to)`.
- KPI cards: *Chiffre d’affaires* (net of refunds), *Commandes*, *Panier moyen*, *Couverts confirmés*, *Taux de confirmation des retenues*, *No-shows*, *Annulations*.
- Charts (plain SVG, axis computed from the data, burgundy bars, labels in French): revenue by day, covers by day. *Plats les plus vendus* (top 10), *Créneaux les plus demandés*.
- *Exporter CSV* of by-day rows.
- **Mensuel**: `<input type="month">` default current Paris month → `monthly_report`. Summary cards + table *N°, Date, Client, Mode, Paiement, Statut (French), Total*. *Imprimer / PDF* with house header. Footer: *Les éléments mis à la corbeille sont exclus.*

### 6.9 E-mails — `/admin/{house}/emails`
Journal from `email_logs` (last 200, realtime). Filters *Tous / Envoyés / Non envoyés / Ignorés*; search recipient/subject. Preview panel (De, À, Type in French, Date, ID Resend, Erreur, HTML in a sandboxed iframe). Trash one or all. Action *Renvoyer* for failed ones (re-runs the send, new log row).

### 6.10 Corbeille — `/admin/{house}/corbeille`
Sections *Réservations*, *Commandes*, *Messages*, *E-mails* (`deleted_at is not null`). Each row shows *Suppression définitive le {deleted_at + 35 j}*. *Restaurer* (restoring a reservation can fail with `table_taken` — show it), *Supprimer définitivement*; bulk *Tout restaurer* / *Tout supprimer* requires typing **SUPPRIMER**.

### 6.11 Réglages — `/admin/{house}/reglages`
Tabs:
1. **Réservations** (`settings`): *Réservations en ligne* on/off (off → public form shows *Les réservations en ligne ne sont pas disponibles pour le moment.* + the house phone), *Durée d’une retenue* (min 15), *Créneaux proposés* (chip editor + *Générer depuis les horaires* every 15/30 min, stops `hold` before closing), *Couverts max en ligne*, *Délai minimum (min)*, *Réservable jusqu’à (jours)*.
2. **Commandes** (`ordering_settings`): *Retrait* on/off, *Livraison* on/off, *Espèces au retrait* on/off, *Frais de retrait*, *Remise à emporter (%)* (drinks excluded), *Temps de préparation*, *Frais de livraison*, *Minimum livraison*, *Codes postaux livrés* (chips, empty = tous, indicative), *Délai de livraison*, *Dernière commande X min avant fermeture*. If `stripeConfigured(house)` is false: switches disabled with *Stripe n’est pas configuré pour cette maison (clés STRIPE_*_{HOUSE}).*
3. **Horaires & fermetures** (`house_ops`, `house_closures`): phone (auto-builds `phone_href` `tel:+33…`), *Libellé horaires*, *Note*, midi ouverture/fermeture, soir ouverture/fermeture, *Service continu*, *Jours de fermeture* (Lun…Dim chips, ISO 1–7), adresse, e-mail de contact, nom d’expéditeur. **Fermetures exceptionnelles**: list + add (du, au, portée *Tout / Réservations / Commandes*, raison). These drive the public calendar, the house page banner and the RPCs.
4. **E-mails** (`settings`): *E-mail de la maison* (`notify_email`), templates *Retenue — client*, *Retenue — maison*, *Confirmation — client*, *Annulation — client* (subject + body each). Placeholders shown as clickable chips: `{{house}} {{table}} {{zone}} {{date}} {{start}} {{end}} {{guests}} {{name}} {{phone}} {{email}} {{note}} {{housePhone}} {{cancelUrl}}`. Live preview with sample data, *Réinitialiser le modèle*, *M’envoyer un test*.

Each tab saves with its own *Enregistrer* and toast *Réglages enregistrés*.

### 6.12 Owner-only pages
- **Maisons** `/admin/maisons`: two cards side by side (today from `admin_dashboard_today`: à confirmer, confirmées, couverts, commandes en cours, CA du jour, messages) with *Ouvrir Montmartre* / *Ouvrir Poissonnière*. The owner sees both because RLS allows it — never by calling the secret key.
- **Équipe** `/admin/equipe`: list staff (e-mail, maison, rôle, actif, dernière connexion). *Ajouter un membre* (e-mail, maison, nom) → secret-key `auth.admin.createUser` with a random password + insert `staff_members`, then send a reset link so they choose their password. *Désactiver / Réactiver* (`staff_members.active`), *Envoyer un lien de réinitialisation*. The owner cannot deactivate themself.
- **Marque** `/admin/marque`: `site_settings.contact_email`.

---

## 7. Deep integration with the public website

Keep the public design exactly as it is; replace hard-coded data with database data.

### 7.1 House data everywhere
House pages, footer, contact page and `/reservation` read address, phone, `phone_href`, hours label/note from `house_ops` (server components, cached with tag `house:{house}`, revalidated when Réglages save). An active `house_closures` row for today or upcoming 7 days shows a discreet line on the house page: *Fermeture exceptionnelle le {date} — {raison}*.

### 7.2 Menu
- `scripts/import-menu.ts`: read the menu currently hard-coded in the repo and insert it for **both** houses (categories matched by slug, prices to cents, featured = the six signature dishes shown today). Idempotent (upsert by house + name). Run once; then delete the hard-coded data and read from `getMenu(house)`.
- `getMenu(house)`: publishable-key query of active categories + their dishes ordered by `display_order`, cached with tag `menu:{house}`. The house page's signature section = `featured` dishes. Unavailable dishes show *Épuisé* (not hidden). Allergens reachable per dish (*Allergènes* disclosure).

### 7.3 Reservation flow (`/reservation?maison=…`)
- `GET /api/availability?maison=&date=&couverts=` → validate → `rpc('get_availability')` (publishable key is enough) → `Cache-Control: no-store`. The grid shows slots; tables where `free && fits` are selectable; `past` slots disabled; `closed` shows *Fermé ce jour-là.*; `enabled=false` hides the form and shows the unavailable message + phone.
- `POST /api/reservations`: zod (house, table_id, date, start, guests, name, phone FR format, email optional, note ≤ 300, `website` honeypot must be empty, `startedAt` ≥ 3 s ago) → secret-key `rpc('place_hold', {…, p_hold_minutes: null, p_status: 'held'})` → e-mails *Retenue — client* (if e-mail) and *Retenue — maison* to `notify_email` → `{ ok, reservationId, emailSent }`. Map RPC errors to French with status 409 (`table_taken`) / 422 / 403.
- Success copy stays honest: *Table retenue, pas encore confirmée. Appelez le {housePhone} pour confirmer — sans appel, la maison peut libérer la table.* Never "confirmée".
- Guest e-mail contains `{{cancelUrl}}` = `${SITE_URL}/reservation/annuler?token={cancel_token}`. That page asks *Annuler ma réservation ?* → `POST /api/reservations/cancel {token}` → secret key: find by `cancel_token` → `set_reservation_status(id, 'cancelled')` → e-mail to the house. Already cancelled/released → friendly message.

### 7.4 Contact (`/contact`)
Form gets a required *Maison* select (preselected from `?maison=`). `POST /api/contact` (zod + honeypot) → secret-key insert into `contact_messages` with that house → e-mail to that house's `notify_email` (fallback `house_ops.contact_email`, then `site_settings.contact_email`). The message appears live in that house's *Messages* only.

### 7.5 Online ordering (per house)
Entry points: a *Commander à emporter* button on each house page and in the house menu section, visible only when `get_ordering_status(house)` says pickup or delivery is open (else *Commande en ligne indisponible pour le moment* or nothing).

- **`/{house}/commander`**: the house menu with add-to-cart (orderable & available dishes only). **Cart is per house** (`localStorage` key `mh_cart_{house}`, try/catch; a cart never mixes houses). Mode selector according to status (both / pickup only / delivery only / none → *Les commandes en ligne ne sont pas disponibles pour le moment.*). Show prep/delivery time, fees, discount line, delivery minimum progress. No payment choice on the cart.
- **`/{house}/commander/paiement`**: name, phone, e-mail, *Dès que possible* or a time slot today, note; delivery: address line 1, complément, code postal, ville, instructions. Payment: **Carte** (Stripe Payment Element with `getPublishableKey(house)`) or **Espèces au retrait** (pickup only, if enabled; for delivery show *Non disponible pour la livraison (carte en ligne uniquement).*). Summary always comes from the server quote, never from client math.
- **APIs** (all validate `params.house` with `isHouse`, all use the secret key):
  - `POST /api/checkout/{house}/quote` → `checkout_quote` → quote for display.
  - `POST /api/checkout/{house}/intent` → `checkout_quote(card)` → Stripe `paymentIntents.create({ amount: total_cents, currency: 'eur', automatic_payment_methods: { enabled: true }, metadata: { house, kind: 'order' }, receipt_email })` with **the house's key** → insert `checkout_intents { house, payment_intent_id, quote, customer, amount_cents }` → `{ clientSecret, paymentIntentId, quote }`. **No order, no e-mail.**
  - Client `stripe.confirmPayment` with `return_url = /{house}/commander/paiement?retour=1`, then `POST /api/checkout/{house}/confirm { paymentIntentId }`.
  - `finalizePaidOrder(house, piId)` (shared by confirm + webhook): retrieve PI with the house key; require `status === 'succeeded'` and `metadata.house === house`; load `checkout_intents` by PI and house; derive `stripe_payment_label` (*Apple Pay*, *Google Pay*, *Link*, *Carte Visa ···· 4242*, fallback *Carte bancaire*); `checkout_create_order(house, intent.quote, intent.customer, { method: 'card', status: 'paid', payment_intent_id, amount_cents: pi.amount_received, stripe_payment_label })`; **only if `created`** send *Commande — client* + *Nouvelle commande — maison*. Return `{ orderNumber, token }` (token = `orders.cancel_token`). Success UI only after this returns.
  - `POST /api/checkout/{house}/cash` → `checkout_quote(cash)` → `checkout_create_order(..., { method: 'cash' })` → both e-mails → `{ orderNumber, token }`.
  - `POST /api/webhooks/stripe/{house}`: raw body (`await req.text()`), verify with `STRIPE_WEBHOOK_SECRET_{HOUSE}`; `payment_intent.succeeded` → `finalizePaidOrder`; `payment_intent.payment_failed` → intent `failed` + `last_error` (no order, no e-mail); `charge.refunded` → update `refunded_cents` / `payment_status` (`refunded` or `partially_refunded`). Always 200 after handling; 400 on bad signature. Configure one endpoint per house in each owner's Stripe dashboard.
- **`/commande/{token}`**: order number, house, status timeline, items, total, payment, pickup address or delivery address; polls `GET /api/orders/{token}` every 20 s (secret key, returns only this order's public fields). *Annuler ma commande* only while `pending`: cash → cancel; card → refund with the house key then cancel; both e-mail the house (*Commande annulée par le client*).

### 7.6 Event banners popup
`EventBannersPopup` in the public layout. On `/` it shows active banners of **both** houses with `show_on_home` (each labelled with its house); on `/montmartre` or `/poissonniere` only that house's. Data via publishable-key select (RLS returns only enabled banners running today in Paris). Stacked cards (image, title, text, optional link), close `X` top-right, focus-trapped, `Esc` closes. Dismissal stored in `sessionStorage` under a fingerprint of `id + updated_at + ends_on` (try/catch). Uses existing `FadeIn`.

### 7.7 Cron `/api/cron/daily` (Vercel cron `0 3 * * *` in `vercel.json`)
Require `Authorization: Bearer ${CRON_SECRET}`. With the secret key: select `event_banners` where `ends_on < parisToday()`, `storage.from('event-banners').remove(paths)`, then delete the rows. If `pg_cron` is not enabled, also `rpc('purge_trash', { p_days: 35 })`. Return counts.

---

## 8. E-mail module (`src/lib/email`, server-only)

`sendEmail({ house, type, to, subject, html, entity: { type, id } })`:
1. Insert `email_logs` `status='queued'` with the secret key. If the insert hits the idempotency index (same entity + type + recipient already queued/sent), return `{ sent: false, duplicate: true }` and send nothing.
2. No `RESEND_API_KEY` → update row `skipped`, return `{ sent: false }`.
3. Send through Resend, from `{house_ops.email_from_name ?? display_name} <{house}@{EMAIL_FROM_DOMAIN}>`, reply-to the house `contact_email`.
4. Update `sent` + `provider_id`, or `failed` + `error`. Never throw into the caller; the caller reports `emailSent`.

Templates: editable ones come from `settings` (plain text with placeholders → escaped → simple branded HTML: paper background, burgundy header with house name, Space Grotesk fallback to system sans). Values are HTML-escaped before substitution. If a template is empty, use a sensible French default.

| type | To | When |
| --- | --- | --- |
| `reservation_hold_guest` | guest | website hold (template *Retenue — client*) |
| `reservation_hold_house` | notify_email | website hold (template *Retenue — maison*) |
| `reservation_confirmed_guest` | guest | Confirmer |
| `reservation_cancelled_guest` | guest | staff Annuler |
| `reservation_cancelled_by_guest_house` | notify_email | guest cancel link |
| `order_confirmation_guest` | customer | paid card finalize / cash order |
| `order_new_house` | notify_email | same moment |
| `order_accepted_guest` | customer | Accepter |
| `order_ready_guest` | customer | Prête |
| `order_cancelled_guest` | customer | staff Annuler / Annuler et rembourser |
| `order_cancelled_by_guest_house` | notify_email | guest cancels |
| `contact_message_house` | notify_email | contact form |
| `staff_test` | staff | *M’envoyer un test* |

French labels for these types are shown in the E-mails journal.

---

## 9. Motion and design rules for the admin
- Same tokens as the site: burgundy primary, paper background, ink text; Epilogue for titles, Space Grotesk for UI/numbers (tabular figures for times and money).
- Dense and legible: 14–15 px body, 44 px touch targets (staff use tablets during service), sticky table headers.
- Motion: `FadeIn` for page sections, `Stagger` for card grids (tables, dishes), `HoverLift` for clickable cards only. No motion on lists that update in realtime.
- Every destructive action has a confirm dialog with the exact consequence in French.
- Every list has loading skeletons, an empty state, and an error state (*Impossible de charger — réessayer*).
- Accessible: labels on every input, focus rings, `aria-live` for toasts, keyboard navigation in dialogs.

---

## 10. Do not
- Do not create two apps, two deployments or duplicated page files per house. One `[house]` route tree.
- Do not let a house come from a form field, a query string or localStorage for staff writes.
- Do not use the secret key in any staff read path (it would bypass RLS and break isolation).
- Do not use `getSession()` for authorization on the server; use `getClaims()`.
- Do not show a hold as confirmed anywhere public.
- Do not create an `orders` row at PaymentIntent creation, and do not send order e-mails before payment succeeded.
- Do not use one Stripe account for both houses.
- Do not add customer accounts, signup, loyalty, a table-layout drawing editor, geocoding, or any admin page not listed above.
- Do not compute prices, fees, discounts or availability in the browser as the source of truth.

---

## 11. Verify in the browser (record each step; fix until all pass)

Isolation (use two different browsers or a private window):
1. Login with a wrong password → *E-mail ou mot de passe incorrect.*
2. Login Montmartre → lands on `/admin/montmartre`. Type `/admin/poissonniere/commandes` → redirected to `/admin/montmartre/commandes`.
3. In Montmartre's browser console: `supabase.from('reservations').select('house')` → only `montmartre`.
4. Login Poissonnière in the other browser. Place a website hold on Poissonnière → toast appears in Poissonnière only; Montmartre receives nothing.
5. Owner login → `/admin/maisons` shows both; switcher keeps the sub-path.
6. Owner deactivates the Poissonnière staff in *Équipe* → that browser's next action fails and it lands on login.

Reservations:
7. Public `/reservation?maison=montmartre`: hold table Salle 1 at 19:30 → success copy says *pas encore confirmée*; the same table at 20:00 is shown taken; at 21:00 it is free.
8. Admin *Retenues*: the hold is there → **Confirmer (appel fait)** → guest gets the confirmation e-mail (or *E-mail non envoyé* if Resend is missing).
9. **Libérer** a hold → public grid frees that table immediately.
10. **Bloquer une table** Salle 2 19:30 → public grid shows it taken.
11. **Durée** 90 → 150 on a hold that would overlap the next one → *Cette table est déjà prise sur ce créneau.*; on a free one → saved, grid updated.
12. Guest cancel link from the e-mail → reservation cancelled, house notified.
13. Réglages → Réservations off → public form shows the unavailable message; API returns the same message; existing holds still manageable.

Menu, events, messages:
14. Add a dish in Montmartre's *Carte* with photo and allergens → appears on `/montmartre`, not on `/poissonniere`. Mark *Épuisé* → shows *Épuisé* publicly.
15. Create a banner in Poissonnière (today → tomorrow, *Aussi sur l’accueil*) → popup on `/` and `/poissonniere`, not on `/montmartre`; close → hidden for the session.
16. Contact form with *Maison = Montmartre* → message only in Montmartre's *Messages*.

Ordering (Stripe test keys for each house):
17. Montmartre: turn on *Retrait*. Order with card `4242…`, abandon on the payment step → no order in admin. Pay → one order `M…`, toast, customer + house e-mails; reload the confirmation page → still one order (idempotent).
18. Card `4000 0025 0000 3155` (3DS) → return URL finalizes correctly.
19. Cash pickup order → *Espèces — à encaisser*; **Encaisser** → encaissé.
20. Delivery + cash is impossible in the UI and rejected by the API.
21. **Annuler et rembourser** a paid card order → refund visible in Montmartre's Stripe dashboard (not Poissonnière's), e-mail sent, status Annulée/Remboursée.
22. **Pause 30 min** → public checkout shows the pause message.

Reports & trash:
23. *Rapports* numbers match the orders and reservations created above; Montmartre's report never includes Poissonnière.
24. Trash a reservation → Corbeille → Restaurer → back on the board. Bulk delete requires typing SUPPRIMER.

## 12. Acceptance checklist
- [ ] All routes in §3 exist; legacy `/admin/tables` and `/admin/settings` redirect.
- [ ] Staff of one house can never render, fetch, receive realtime from, upload into or be redirected into the other house.
- [ ] Owner can open both houses and the three owner pages; staff cannot.
- [ ] Every RPC error is shown in French through `errors.ts`.
- [ ] No secret key in client bundles (`grep -r SECRET .next/static` is empty).
- [ ] Public menu, hours, phones and closures come from the database; hard-coded copies removed.
- [ ] Holds are never presented as confirmed publicly; Confirmer sends the confirmation.
- [ ] Payment-first ordering works per house with separate Stripe accounts; webhook and confirm are idempotent.
- [ ] E-mails logged for every attempt; missing Resend shows *E-mail non envoyé*.
- [ ] Expired banners' files disappear after the daily cron.
- [ ] `pnpm build` (or the repo's build) and lint pass; types regenerated from Supabase.
