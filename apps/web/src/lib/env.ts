const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
const paymentsProvider =
  (process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER as 'mock' | 'stripe' | undefined) ?? 'mock';

export const env = {
  apiUrl,
  paymentsProvider,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
} as const;
