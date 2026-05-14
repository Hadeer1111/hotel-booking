import type { PaymentStatus } from '@prisma/client';

/** Provider-agnostic intent shape returned from createIntent(). */
export interface PaymentIntentResult {
  providerPaymentId: string;
  clientSecret: string | null;
  status: PaymentStatus;
}

/** Normalised event emitted by the webhook layer after signature verification. */
export interface PaymentEvent {
  providerEventId: string;
  type: 'payment_succeeded' | 'payment_failed' | 'payment_refunded';
  providerPaymentId: string;
  rawPayload: Record<string, unknown>;
}

/**
 * Strategy interface for payment providers (mock + Stripe).
 * Selected at module-init time based on PAYMENTS_PROVIDER env.
 */
export interface PaymentsProvider {
  /** Provider name, written to Payment.provider for audit. */
  readonly name: string;

  createIntent(input: {
    bookingId: string;
    amount: number;
    currency: string;
  }): Promise<PaymentIntentResult>;

  /**
   * Verify and parse a webhook payload. Returns null when the event is
   * intentionally ignored (e.g. unrelated event types).
   */
  handleWebhook(rawBody: Buffer, signature: string): Promise<PaymentEvent | null>;
}

/** Nest DI token. */
export const PAYMENTS_PROVIDER = Symbol('PAYMENTS_PROVIDER');
