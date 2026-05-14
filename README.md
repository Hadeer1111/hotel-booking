# Hotel Booking Management System

A full-stack mini-system for browsing hotels, booking rooms, and managing the
inventory behind them — built as a senior-grade reference implementation.

> Stack: **Next.js 15 (App Router)** + **NestJS 10** + **PostgreSQL 16** +
> **Prisma** + **TanStack Query v5** + **React Hook Form / Zod** + **shadcn/ui** +
> **Stripe** + **pnpm workspaces**.

---

## Why this repo is interesting (architecture highlights)

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
- **Single-flight refresh interceptor** on the web client: a burst of expired
  requests issues exactly one `/auth/refresh` and then replays in parallel.
- **Shared `@hotel-booking/types`** workspace package — the same Zod schema
  validates `RegisterInput` on the API DTO and the React Hook Form resolver.
- **Role-aware dashboard** in a single round trip (Prisma `$transaction` +
  one raw aggregation per panel).

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

## Quickstart

### 1. Prerequisites

- Node 20 (`.nvmrc` pinned), pnpm 10, Docker (or your own Postgres 16+).

### 2. Install dependencies

```bash
pnpm install
```

> On first run pnpm may prompt to approve build scripts (`bcrypt`, `prisma`,
> `esbuild`, …) — type `a` then `y`.

### 3. Start Postgres + provision the DB

```bash
docker compose up -d postgres
pnpm --filter @hotel-booking/api prisma:migrate   # applies migrations
pnpm --filter @hotel-booking/api prisma:seed      # seeds admin, managers, customers
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

### Seed accounts

After `prisma:seed`:

| Role     | Email                     | Password       |
| -------- | ------------------------- | -------------- |
| ADMIN    | `admin@hotel-booking.dev` | `Admin123!`    |
| MANAGER  | `manager1@hotel-booking.dev` | `Manager123!` |
| CUSTOMER | `customer1@hotel-booking.dev` | `Customer123!` |

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

| Method | Path                                            | Auth                | Notes                                  |
| ------ | ----------------------------------------------- | ------------------- | -------------------------------------- |
| POST   | `/v1/auth/register`                             | public              | email + password + name                |
| POST   | `/v1/auth/login`                                | public              | issues access + refresh tokens         |
| POST   | `/v1/auth/refresh`                              | refresh token       | rotates with reuse detection           |
| POST   | `/v1/auth/logout`                               | refresh token       | revokes a single token                 |
| GET    | `/v1/auth/me`                                   | access token        | returns the AuthUser                   |
| GET    | `/v1/hotels`                                    | public              | paginated, `q=` search, `city=`        |
| GET    | `/v1/hotels/:id`                                | public              | hotel detail                           |
| POST   | `/v1/hotels`                                    | ADMIN               | create                                 |
| PATCH  | `/v1/hotels/:id`                                | ADMIN or owning MANAGER | update                              |
| DELETE | `/v1/hotels/:id`                                | ADMIN               | delete                                 |
| GET    | `/v1/hotels/:id/room-types`                     | public              | list room types                        |
| POST   | `/v1/hotels/:id/room-types`                     | ADMIN / MANAGER     | create category                        |
| GET    | `/v1/hotels/:id/rooms`                          | public              | list physical rooms                    |
| POST   | `/v1/hotels/:id/rooms`                          | ADMIN / MANAGER     | add a room                             |
| GET    | `/v1/hotels/:id/availability?checkIn=&checkOut=` | public              | per-room-type availability             |
| POST   | `/v1/bookings`                                  | CUSTOMER / ADMIN    | transactional booking creation         |
| GET    | `/v1/bookings`                                  | any role            | role-scoped list                       |
| GET    | `/v1/bookings/:id`                              | owner / manager / admin | booking detail                     |
| PATCH  | `/v1/bookings/:id/status`                       | role-aware          | PENDING→CONFIRMED, *→CANCELLED         |
| POST   | `/v1/payments/webhook`                          | provider signature  | idempotent via PaymentEvent.id        |
| GET    | `/v1/dashboard/stats`                           | any role            | role-aware aggregated tiles + 12-mo chart |
| GET    | `/docs`                                         | public              | Swagger / OpenAPI                      |

Full request/response shapes live in `packages/types/src/index.ts`.

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

---

## Testing

```bash
pnpm -r typecheck            # workspace-wide tsc --noEmit
pnpm -r lint                 # workspace-wide eslint
pnpm --filter @hotel-booking/api test         # Jest unit tests (no DB)
pnpm --filter @hotel-booking/api test:e2e     # Supertest e2e (DB required)
pnpm --filter @hotel-booking/web test         # Vitest unit tests
pnpm --filter @hotel-booking/web test:e2e     # Playwright (RUN_PLAYWRIGHT=1)
```

The headline concurrency test is `apps/api/test/bookings.concurrency.e2e-spec.ts`.
It runs against a real Postgres and asserts that 8 parallel bookings on the
last available room produce exactly one 201 and seven 409 NO_AVAILABILITY
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

See `.github/workflows/ci.yml`.

---

## Production notes

- API horizontal scale: stateless, Postgres is the only stateful dependency.
- Logs are JSON via `nestjs-pino`. Pipe `pino-pretty` only in dev.
- Helmet + CORS allowlist + rate limiting via `@nestjs/throttler` (10/min on
  `/auth/*`).
- `helmet` enabled globally.
- Web is a stock Next 15 build — deploy on Vercel; the API runs anywhere with
  Postgres + Node 20.

---

## Roadmap (out of scope for the take-home)

- httpOnly refresh-token cookie + CSRF.
- Real-time booking updates via SSE or WebSocket.
- File uploads for hotel photos (S3 presigned).
- Multi-currency price tables per hotel.
- Calendar UI for the manager surface.
