import { Injectable, Logger } from '@nestjs/common';
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';
import { AppConfigService } from '../../../config/app-config.service';
import type {
  PaymentEvent,
  PaymentIntentResult,
  PaymentsProvider,
} from '../payments-provider.interface';

/**
 * Mock provider used by tests and `PAYMENTS_PROVIDER=mock`.
 * - createIntent returns a deterministic mock_pi_<uuid> + clientSecret null.
 * - Webhook signatures are produced by an HMAC over the body with a shared
 *   secret so we can still exercise the signature-verification code path.
 */
@Injectable()
export class MockPaymentsProvider implements PaymentsProvider {
  readonly name = 'mock';
  private readonly logger = new Logger(MockPaymentsProvider.name);
  private readonly webhookSecret: string;

  constructor(config: AppConfigService) {
    this.webhookSecret =
      config.get('STRIPE_WEBHOOK_SECRET') ?? 'mock-webhook-secret-change-me';
  }

  async createIntent(input: {
    bookingId: string;
    amount: number;
    currency: string;
  }): Promise<PaymentIntentResult> {
    const id = `mock_pi_${randomUUID()}`;
    this.logger.debug(
      `[mock] createIntent booking=${input.bookingId} amount=${input.amount} ${input.currency} -> ${id}`,
    );
    return {
      providerPaymentId: id,
      clientSecret: null,
      status: 'REQUIRES_PAYMENT',
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<PaymentEvent | null> {
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    const provided = signature.replace(/^sha256=/, '');
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
    ) {
      throw new Error('invalid mock webhook signature');
    }

    const parsed = JSON.parse(rawBody.toString('utf8')) as {
      id?: string;
      type?: PaymentEvent['type'];
      providerPaymentId?: string;
      [k: string]: unknown;
    };
    if (!parsed.id || !parsed.type || !parsed.providerPaymentId) return null;

    return {
      providerEventId: parsed.id,
      type: parsed.type,
      providerPaymentId: parsed.providerPaymentId,
      rawPayload: parsed,
    };
  }
}
