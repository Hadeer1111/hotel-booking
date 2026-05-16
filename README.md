# Hotel Booking Management System

A full-stack mini-system for browsing hotels, booking rooms, and managing the
inventory behind them — built as a senior-grade reference implementation.

> Stack: **Next.js 15 (App Router)** + **NestJS 10** + **PostgreSQL 16** +
> **Prisma** + **TanStack Query v5** + **React Hook Form / Zod** + **shadcn/ui** +
> **Tailwind CSS** + **Stripe** + **pnpm workspaces**.

---

## Assignment / PDF surface (what reviewers often look for)

- **Rooms API:** Inventory is nested under each hotel (`GET/POST/PATCH /v1/hotels/:hotelId/rooms`). The same operations are also exposed on **`/v1/rooms`** for PDF-style examples: `GET ?hotelId=…`, `POST` with `hotelId` in the body, `PATCH /v1/rooms/:roomId`.
- **Create booking flow:** Authenticated **`/bookings/new`** (linked in the header as “Book a stay”) plus booking from each hotel’s detail page (`/hotels/:id`). Use `?hotel=<uuid>` on `/bookings/new` to pre-select a property.
- **Docker Compose:** Profile **`full`** binds the **repo root** into `node:20-bookworm-slim`, runs **Corepack + pnpm@10.10.0** and `pnpm install --frozen-lockfile`, then API and web dev servers (no per-app Dockerfiles required).

---

## Why this repo is interesting

### Backend correctness

- **Booking correctness is the headline feature.** Every layer is involved:
  - The transaction runs at `SERIALIZABLE` isolation.
  - Inside it, we pick a free physical room with `SELECT ... FOR UPDATE SKIP LOCKED`.
  - A Postgres `EXCLUDE` constraint on `tstzrange(checkIn, checkOut)` makes
    double-bookings *physically impossible* even if app logic regresses.
  - A dedicated e2e test fires 8 parallel POSTs and asserts exactly one wins.
  - **Why SKIP LOCKED with SERIALIZABLE?** SKIP LOCKED only affects *throughput*:
    it prevents parallel bookings of the same room-type from queueing on a
    single row, so each transaction picks a *different* room. Correctness is
    independently guaranteed by the exclusion constraint. SERIALIZABLE keeps
    the multi-statement read+write graph honest.
- **Refresh-token rotation with family invalidation.** Replaying a previously
  rotated refresh token burns the entire token family — a hijacked token is
  worth a single use at most, and the legitimate user is forcibly logged out.
- **RFC 7807 problem-details errors** everywhere, with a global Nest exception
  filter that maps `ZodError`, Prisma `P2002`/`P2025`, and `HttpException` into
  `application/problem+json`.
- **Pluggable PaymentsProvider** strategy with a `MockPaymentsProvider` (HMAC
  signatures so the verify path is still exercised) and `StripePaymentsProvider`
  (test-mode keys + idempotent webhook handling).
- **Role-aware dashboard** in a single round trip (Prisma `$transaction` +
  one raw aggregation per panel).
- **Multi-star filter on `/v1/hotels`** — accepts `?stars=4,5` (CSV) or the
  repeated `?stars=4&stars=5` shape; values are coerced, deduped, clamped to
  `[1,5]`, and rejected silently if invalid. Backed by `WHERE stars IN (…)`.
- **`minNightlyPrice` enrichment** on `GET /v1/hotels` — one bounded
  `groupBy` aggregation joins each page of hotels with the cheapest published
  room-type rate, so list cards can render *"from $X / night"* without an
  N+1. `null` when the hotel has no room types yet.

### Frontend craft

- **Single-flight refresh interceptor** on the web client: a burst of expired
  requests issues exactly one `/auth/refresh` and then replays in parallel.
- **Shared `@hotel-booking/types`** workspace package — the same Zod schema
  validates `RegisterInput` on the API DTO and the React Hook Form resolver.
- **Infinite scroll on /hotels** using `useInfiniteQuery` + an
  `IntersectionObserver` sentinel; URL-synced search (`?q=`) and star filter
  (`?stars=4,5`) make every list view bookmarkable and back-button-friendly.
- **Tropical Joy design system** — a turquoise + sunshine + peach palette
  applied via shadcn HSL tokens, brand-tinted shadows, an animated gradient
  hero, deterministic per-hotel duotone gradients, Unsplash cover photos
  hashed deterministically by hotel name, **fully token-driven dark mode**
  via `next-themes` with system / light / dark cycling from the header,
  and a small library of reusable primitives (`PageHero`, `HotelCard`,
  `StatusBadge`, `BrandLogo`, `AuthShell`, `ThemeToggle`, `useCountUp`,
  `useIntersectionObserver`).
- **Motion vocabulary**: page entrance `fade-up`, hero `gradient-shift`,
  decorative `float`, chip activate `pop-in`, list-item `pop` on hover,
  Kenburns image zoom on hover, animated dashboard counters
  (rAF + ease-out-cubic), pulsing status badges for pending states.
- **Wishlist** (browser-local, no API): a heart toggle lives on every card
  and on the detail hero, the header carries a counted heart pill, and
  `/wishlist` fetches each saved hotel in parallel via `useQueries`.
  State syncs across tabs via the native `storage` event, SSR-safe
  hydration avoids flicker, and unauthenticated visitors can curate a list
  before signing up.
- **Responsive layout:** `overflow-x-hidden` on the document body prevents
  accidental horizontal scroll from wide charts or calendars. The global
  Tailwind `container` increases horizontal padding from `sm` → `lg`.
  **Navigation** collapses into a touch-friendly menu (hamburger) below the
  `md` breakpoint while primary links stay pill-styled on tablets and up.
  Heroes (`PageHero`, `StaffPageHero`) use tighter radii and typography on
  small screens. The **hotel detail** date picker renders one calendar month on
  narrow viewports and two from `md` up. **Dashboard** charts use stable margins,
  short month ticks, and fixed Y-axis widths so dual scales remain legible on
  phones. Staff **room
  inventory** tables sit in horizontal scroll regions on small breakpoints.
  **Auth** shells and booking cards use stacked→row flex patterns with full-width
  primary actions where appropriate.
  Convenience hook:
  [`apps/web/src/hooks/use-media-query.ts`](apps/web/src/hooks/use-media-query.ts)
  (client-side `matchMedia`) powers the hotel-detail calendar pane count (one month
  on narrow viewports, two from `md` up).

---

## Repo layout

```
apps/
  api/          NestJS REST API (TypeScript)
  web/          Next.js 15 web client (App Router)
packages/
  config/       shared ESLint, Prettier, tsconfig
  types/        shared Zod schemas + DTO types (FE + BE)
docker-compose.yml
```

---

## Design system

The **Tropical Joy** palette is defined once as shadcn HSL custom properties
in [`apps/web/src/app/globals.css`](apps/web/src/app/globals.css) so every
page picks it up automatically. A dark counterpart lives under `.dark` and is
toggled by [`next-themes`](https://github.com/pacocoursey/next-themes) — the
provider still defaults to `system` so first-time visitors get their OS
preference, while the `ThemeToggle` in the header flips between **light and
dark** explicitly (sun ↔ moon, no third "system" stop in the cycle),
persists the choice in `localStorage`, and swaps the html class without
animating through an intermediate state.

| Token        | Light                | Role                                                       |
| ------------ | -------------------- | ---------------------------------------------------------- |
| `--background` | peach-tinted ivory | page surface                                               |
| `--primary`    | turquoise `#06B6D4` | brand CTA, focus rings, active nav                         |
| `--accent`     | sunshine yellow    | secondary highlights                                       |
| `--muted`      | peach-100          | quiet info panels                                          |
| `--ring`       | turquoise          | focus visible state                                        |
| `--radius`     | `0.875rem`         | larger than shadcn default for a friendlier feel           |

Brand-named semantic tokens live in
[`apps/web/tailwind.config.ts`](apps/web/tailwind.config.ts):
`brand-turquoise`, `brand-turquoiseDeep`, `brand-sunshine`, `brand-peach`,
`brand-coral`. Two custom shadows (`shadow-soft`, `shadow-glow`) are tinted
toward turquoise.

### Reusable primitives

| Component                                                                    | Use                                                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`PageHero`](apps/web/src/components/page-hero.tsx)                          | animated gradient strip with floating blob decorations              |
| [`HotelCard`](apps/web/src/components/hotel-card.tsx)                        | image cover + duotone gradient fallback, Kenburns zoom, star badge  |
| [`BrandLogo`](apps/web/src/components/brand-logo.tsx)                        | brand mark used in the site header and the auth shell               |
| [`StatusBadge`](apps/web/src/components/status-badge.tsx)                    | brand-tinted chip for all `BookingStatus` + `PaymentStatus` values  |
| [`AuthShell`](apps/web/src/components/auth/auth-shell.tsx)                   | two-column login/register layout with branded left panel            |
| [`WishlistButton`](apps/web/src/components/wishlist/wishlist-button.tsx)     | heart toggle with pulse animation, used on cards and the detail hero |
| [`WishlistLink`](apps/web/src/components/wishlist/wishlist-link.tsx)         | header heart pill with a count badge, links to `/wishlist`          |
| [`ThemeToggle`](apps/web/src/components/theme-toggle.tsx)                    | two-state light ↔ dark toggle (sun / moon) driving `next-themes`    |
| [`Calendar`](apps/web/src/components/ui/calendar.tsx) + [`Popover`](apps/web/src/components/ui/popover.tsx) | shadcn primitives over `react-day-picker`, used by the hotel detail range picker |
| [`useCountUp`](apps/web/src/hooks/use-count-up.ts)                           | rAF-driven ease-out-cubic value tween for dashboard tiles           |
| [`useIntersectionObserver`](apps/web/src/hooks/use-intersection-observer.ts) | SSR-safe sentinel hook powering infinite scroll                     |
| [`getHotelGradient`](apps/web/src/lib/hotel-gradient.ts)                     | deterministic duotone from hotel name (8 curated Tailwind palettes) |
| [`getHotelImage`](apps/web/src/lib/hotel-image.ts)                           | deterministic Unsplash cover from a curated set of 16 stable photos |

### Imagery

Hotel cards and detail heroes pull cover photos from
[`images.unsplash.com`](https://images.unsplash.com). The host is allowed in
[`apps/web/next.config.mjs`](apps/web/next.config.mjs) via
`images.remotePatterns`, and `next/image` handles resizing, format
negotiation, and lazy loading. If a photo ever 404s, the deterministic
gradient acts as a graceful fallback so layout is never broken.

---

## Quickstart

### 1. Prerequisites

- Node 20 (`.nvmrc` pinned), pnpm 10, and either Docker (recommended) or your
  own Postgres 14+.

### 2. Install dependencies

```bash
pnpm install
```

> On first run pnpm may prompt to approve build scripts (`bcrypt`, `prisma`,
> `esbuild`, …) — type `a` then `y`.

### 3. Start Postgres + provision the DB

With Docker:

```bash
docker compose up -d postgres
pnpm --filter @hotel-booking/api prisma:migrate   # applies migrations
pnpm --filter @hotel-booking/api prisma:seed      # seeds users + 80 hotels
```

Without Docker (Homebrew Postgres works fine — 14+ supports `btree_gist` and
`tstzrange`):

```bash
brew services start postgresql@16   # or @14
psql -d postgres -c "CREATE ROLE postgres LOGIN SUPERUSER PASSWORD 'postgres';"
psql -d postgres -c "CREATE DATABASE hotel_booking OWNER postgres;"
pnpm --filter @hotel-booking/api prisma:migrate
pnpm --filter @hotel-booking/api prisma:seed
```

### 4. Configure env

Copy the examples:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 5. Run the dev servers

```bash
pnpm --filter @hotel-booking/api dev       # http://localhost:4000 (Swagger: /docs)
pnpm --filter @hotel-booking/web dev       # http://localhost:3000
```

### Stripe (optional local testing)

The API already implements Stripe (`PAYMENTS_PROVIDER=stripe`) and web checkout (`NEXT_PUBLIC_PAYMENTS_PROVIDER=stripe`). Nothing extra to code — only env + webhook forwarding:

1. In **`apps/api/.env`**: `PAYMENTS_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY`.
2. In **`apps/web/.env.local`**: `NEXT_PUBLIC_PAYMENTS_PROVIDER=stripe`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (same Stripe mode as the secret key).
3. From Stripe Dashboard use **test** keys. Because Stripe cannot reach `localhost`, run **`stripe listen --forward-to localhost:4000/v1/payments/webhook`** and put CLI’s **`whsec_…`** into **`STRIPE_WEBHOOK_SECRET`** (replace when you rotate CLI).
4. Complete a booking from the UI; after paying with a [test card](https://stripe.com/docs/testing), the webhook should mark the payment succeeded.

### Seed dataset

The seed script is **idempotent** and produces:

- 1 admin, 2 managers, 3 customers (all with the same password `Password123!`)
- **80 hotels** (4 named + 76 deterministically generated) spread across 16
  cities and all 5 star bands, so the infinite-scroll list and the multi-star
  filter have meaningful data
- 3 room types per hotel × 2–3 physical rooms per type
- 1 confirmed booking + paid payment on the first customer (only created once)

### Seed accounts

After `prisma:seed` (password for **all** accounts is `Password123!`):

| Role     | Email                          |
| -------- | ------------------------------ |
| ADMIN    | `admin@hotelbooking.dev`       |
| MANAGER  | `manager1@hotelbooking.dev`    |
| MANAGER  | `manager2@hotelbooking.dev`    |
| CUSTOMER | `carol@example.com`            |
| CUSTOMER | `chad@example.com`             |
| CUSTOMER | `casey@example.com`            |

---

## Data model (ER diagram)

```
                                   ┌─────────────┐
                                   │   User      │
                                   │ id, email,  │
                                   │ name, role  │
                                   └──┬──────┬───┘
                                      │      │
                  (1)─manages─(0..*)  │      │ (1)─owns─(0..*)
                                      ▼      ▼
                               ┌─────────────┐         ┌──────────────┐
                               │   Hotel     │ 1 ── *  │ RefreshToken │
                               │ id, name,   │         └──────────────┘
                               │ city, stars │
                               └──────┬──────┘
                                      │ (1)
                                      │ ── (0..*)
                                      ▼
                               ┌─────────────┐
                               │  RoomType   │
                               │ name,       │
                               │ capacity,   │
                               │ price/night │
                               └──────┬──────┘
                                      │ (1)
                                      │ ── (0..*)
                                      ▼
                               ┌─────────────┐
                               │    Room     │
                               │ roomNumber  │
                               └──────┬──────┘
                                      │ (1)
                                      │ ── (0..*)
                                      ▼
                               ┌─────────────┐         ┌──────────────┐
                               │   Booking   │ 1 ── 1  │   Payment    │
                               │ checkIn,    │─────────│ provider,    │
                               │ checkOut,   │         │ providerId,  │
                               │ status      │         │ amount, …    │
                               └─────────────┘         └──────┬───────┘
                                                              │ (1)
                                                              │ ── (0..*)
                                                              ▼
                                                       ┌──────────────┐
                                                       │ PaymentEvent │
                                                       │ idempotency  │
                                                       └──────────────┘
```

> Booking has a Postgres `EXCLUDE` constraint:
> `EXCLUDE USING GIST (roomId WITH =, tstzrange(checkIn, checkOut) WITH &&)`
> filtered to rows where `status IN ('PENDING','CONFIRMED')`.

---

## API surface (v1)

| Method | Path                                                | Auth                    | Notes                                                            |
| ------ | --------------------------------------------------- | ----------------------- | ---------------------------------------------------------------- |
| POST   | `/v1/auth/register`                                 | public                  | email + password + name + optional role                          |
| POST   | `/v1/auth/login`                                    | public                  | issues access + refresh tokens                                   |
| POST   | `/v1/auth/refresh`                                  | refresh token           | rotates with reuse detection (burns the family on replay)        |
| POST   | `/v1/auth/logout`                                   | refresh token           | revokes a single token                                           |
| GET    | `/v1/auth/me`                                       | access token            | returns the AuthUser                                             |
| GET    | `/v1/hotels`                                        | public                  | paginated, `q=` search, `city=`, **`stars=4,5`** multi-filter, items carry `minNightlyPrice` |
| GET    | `/v1/hotels/:id`                                    | public                  | hotel detail                                                     |
| POST   | `/v1/hotels`                                        | ADMIN                   | create                                                           |
| PATCH  | `/v1/hotels/:id`                                    | ADMIN or owning MANAGER | update                                                           |
| DELETE | `/v1/hotels/:id`                                    | ADMIN                   | delete                                                           |
| GET    | `/v1/hotels/:id/room-types`                         | public                  | list room types                                                  |
| POST   | `/v1/hotels/:id/room-types`                         | ADMIN / MANAGER         | create category                                                  |
| GET    | `/v1/hotels/:id/rooms`                              | public                  | list physical rooms                                              |
| POST   | `/v1/hotels/:id/rooms`                              | ADMIN / MANAGER         | add a room                                                       |
| GET    | `/v1/hotels/:id/availability?checkIn=&checkOut=`    | public                  | per-room-type availability                                       |
| POST   | `/v1/bookings`                                      | CUSTOMER / ADMIN        | transactional booking creation                                   |
| GET    | `/v1/bookings`                                      | any role                | role-scoped list                                                 |
| GET    | `/v1/bookings/:id`                                  | owner / manager / admin | booking detail                                                   |
| PATCH  | `/v1/bookings/:id/status`                           | role-aware              | PENDING→CONFIRMED, *→CANCELLED                                   |
| POST   | `/v1/payments/webhook`                              | provider signature      | idempotent via `PaymentEvent.id`                                 |
| GET    | `/v1/dashboard/stats`                               | any role                | role-aware aggregated tiles + 12-mo chart                        |
| GET    | `/docs`                                             | public                  | Swagger / OpenAPI                                                |

Full request/response shapes live in
[`packages/types/src/index.ts`](packages/types/src/index.ts).

---

## Page tour (web)

| Route                | Highlights                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/`                  | Animated gradient hero with floating blobs, gradient headline, three feature cards with tilt-on-hover icons.          |
| `/hotels`            | `PageHero` with embedded search pill, multi-star chip filter (URL-synced), infinite-scroll grid of `HotelCard`s. Each card now shows a "from $X / night" pill served by the API. |
| `/hotels/[id]`       | Full-bleed Unsplash cover hero with name overlay, **branded two-month range calendar in a popover**, +/- guest stepper, room cards with pulsing availability dots. |
| `/login`, `/register`| Split `AuthShell` layout — animated branded panel on the left, rounded-xl form with branded submit on the right.      |
| `/bookings`          | Card-based list (no table) with `StatusBadge`s and a friendly empty state.                                            |
| `/bookings/[id]`     | Gradient hero summary with total + status, separated stay and payment cards, animated payment status while pending.   |
| `/dashboard`         | Animated count-up tiles, brand-tinted icon chips, brand chart palette, `StatusBadge` in the status breakdown.         |
| `/wishlist`          | Browser-local favourites grid powered by `useQueries`. The card's existing heart doubles as the remove control, with an animated empty state and a "removed by owner" tile for ids whose hotel no longer exists. |

---

## Decisions log

- **pnpm workspaces** over Turborepo / Nx — minimal tooling, enough for two
  apps + two libs. Turbo can be added later if build caching becomes a need.
- **Prisma**, not Drizzle/Knex — fastest path to a typed schema + migrations.
  We do drop to raw SQL twice where Prisma can't yet express what we need:
  the `btree_gist` extension + exclusion constraint, and the availability
  aggregation.
- **Refresh tokens in localStorage** (vs httpOnly cookie). A take-home doesn't
  warrant the complexity of CSRF tokens for a mutation API, but the token
  store is pluggable so swapping to an httpOnly + SameSite=lax cookie is a
  three-file change.
- **Mock + Stripe via a strategy interface** so the booking flow is testable
  end-to-end without external services.
- **RFC 7807 problem-details** because shipping arbitrary error JSON gets
  parsed differently by every client. Standardising the envelope means
  `ApiError.problem.code === 'NO_AVAILABILITY'` always works.
- **CSV for the `stars` filter** rather than repeated query params — the
  shorter `?stars=4,5` is easier to bookmark, easier for humans to type, and
  the Zod transform accepts both shapes so client choice is preserved.
- **Deterministic gradients + curated Unsplash photos** instead of an image
  upload pipeline. Hashes hotel name → stable image, gives every hotel a
  visual identity for free, and keeps a graceful fallback when the photo is
  unavailable. Trading flexibility for a zero-asset, zero-management pipeline.
- **shadcn HSL tokens for theming** so the design system can be retoned
  (different palette, dark mode) by editing `globals.css` only — every
  component reads from the same tokens.
- **Wishlist in localStorage**, not in Postgres. It keeps the take-home
  scope honest, lets logged-out visitors curate a list, and the provider
  surface (`useWishlist().toggle/has/clear`) is identical to what a future
  `/v1/wishlist` API would expose, so promoting to server-side later is a
  drop-in change behind the same hook.

---

## Testing

```bash
pnpm -r typecheck                                # workspace-wide tsc --noEmit
pnpm -r lint                                     # workspace-wide eslint
pnpm --filter @hotel-booking/api test            # Jest unit tests (no DB)
pnpm --filter @hotel-booking/api test:e2e        # Supertest e2e (DB required)
pnpm --filter @hotel-booking/web test            # Vitest unit tests
pnpm --filter @hotel-booking/web test:e2e        # Playwright (RUN_PLAYWRIGHT=1)
```

The headline concurrency test is
[`apps/api/test/bookings.concurrency.e2e-spec.ts`](apps/api/test/bookings.concurrency.e2e-spec.ts).
It runs against a real Postgres and asserts that 8 parallel bookings on the
last available room produce exactly one 201 and seven 409 `NO_AVAILABILITY`
responses.

---

## CI

GitHub Actions runs on every push and PR:

1. `pnpm install --frozen-lockfile`
2. Spin up Postgres 16 as a service container
3. `prisma migrate deploy`
4. Workspace-wide `lint`, `typecheck`, unit tests
5. API e2e (with `RUN_E2E=1`)
6. Workspace-wide `build`

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Production notes

- API horizontal scale: stateless, Postgres is the only stateful dependency.
- Logs are JSON via `nestjs-pino`. Pipe `pino-pretty` only in dev.
- `helmet` + CORS allowlist + rate limiting via `@nestjs/throttler` (default
  20 req / 60s, applied globally and tightened on `/auth/*`).
- Web is a stock Next 15 build — deploy on Vercel; the API runs anywhere with
  Postgres + Node 20.
- For production imagery, swap the curated Unsplash list for a CDN you own
  (S3 + CloudFront, Cloudflare R2, etc.) and update `next.config.mjs`
  `remotePatterns` accordingly.

---

## Roadmap (out of scope for the take-home)

- httpOnly refresh-token cookie + CSRF.
- Real-time booking updates via SSE or WebSocket.
- File uploads for hotel photos (S3 presigned).
- Multi-currency price tables per hotel.
- Calendar UI for the manager surface.
- Server-backed wishlist (Favorite table) once auth becomes mandatory.
