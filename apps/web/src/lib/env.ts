/**
 * API base used by browser `fetch` calls.
 *
 * - Prefer `NEXT_PUBLIC_API_URL` when set (inlined at build time).
 * - Otherwise in production we use same-origin `/api-backend/v1`, proxied by
 *   `next.config.mjs` rewrites to `API_BACKEND_ORIGIN` — no rebuild to change the backend.
 */
const explicitPublic = process.env.NEXT_PUBLIC_API_URL;

// In production *client* builds, NODE_ENV is inlined as "production", so this becomes
// the literal "/api-backend/v1" unless NEXT_PUBLIC_API_URL is set (see top-of-file note).
const apiUrl =
  explicitPublic ??
  (process.env.NODE_ENV === 'production' ? '/api-backend/v1' : 'http://localhost:4000/v1');

const paymentsProvider =
  (process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER as 'mock' | 'stripe' | undefined) ?? 'mock';

if (
  process.env.NODE_ENV === 'production' &&
  explicitPublic &&
  (explicitPublic.includes('localhost') || explicitPublic.includes('127.0.0.1'))
) {
  console.warn(
    '[hotel-booking] NEXT_PUBLIC_API_URL targets localhost in a production build. Remove it to use the /api-backend proxy with API_BACKEND_ORIGIN, or set NEXT_PUBLIC_API_URL to your public API (…/v1) and redeploy.',
  );
}

export const env = {
  apiUrl,
  paymentsProvider,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
} as const;
