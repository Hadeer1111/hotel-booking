const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
const paymentsProvider =
  (process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER as 'mock' | 'stripe' | undefined) ?? 'mock';

if (
  process.env.NODE_ENV === 'production' &&
  (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1'))
) {
  console.warn(
    '[hotel-booking] NEXT_PUBLIC_API_URL targets localhost in a production build. Set Railway (or host) env to your public API URL ending in /v1, then redeploy so the browser stops calling localhost.',
  );
}

export const env = {
  apiUrl,
  paymentsProvider,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
} as const;
