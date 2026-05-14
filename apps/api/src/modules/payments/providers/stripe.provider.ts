import { Injectable, Logger } from '@nestjs/common';
import StripeSdk from 'stripe';
import { AppConfigService } from '../../../config/app-config.service';
import type {
  PaymentEvent,
  PaymentIntentResult,
  PaymentsProvider,
} from '../payments-provider.interface';

// Stripe v22's published types use a Constructor-vs-namespace split that does
// not surface `Stripe.Event`, `Stripe.PaymentIntent`, etc. on the default
// export. We deliberately type these as the runtime shape we depend on
// (covered by the SDK at runtime + the webhook signature check) and cast at
// the boundary so the rest of the service is fully typed.
interface MinimalEvent {
  id: string;
  type: string;
  data: { object: { id: string; payment_intent?: string | { id: string } | null } };
}
type StripeEvent = MinimalEvent;
type StripePaymentIntent = { id: string };
type StripeCharge = { id: string; payment_intent: string | { id: string } | null };

/**
 * Real Stripe provider (test-mode keys). Currency is configured via STRIPE_CURRENCY;
 * we treat Booking.totalPrice as a decimal amount in that currency and convert to
 * minor units (cents) here at the boundary so the rest of the domain never sees
 * cents.
 */
@Injectable()
export class StripePaymentsProvider implements PaymentsProvider {
  readonly name = 'stripe';
  private readonly logger = new Logger(StripePaymentsProvider.name);
  private readonly stripe: InstanceType<typeof StripeSdk>;
  private readonly webhookSecret: string;
  private readonly currency: string;

  constructor(config: AppConfigService) {
    const secret = config.payments.stripeSecretKey;
    if (!secret) {
      throw new Error('STRIPE_SECRET_KEY is required when PAYMENTS_PROVIDER=stripe');
    }
    const whSecret = config.payments.stripeWebhookSecret;
    if (!whSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required when PAYMENTS_PROVIDER=stripe');
    }
    this.stripe = new StripeSdk(secret, { apiVersion: '2026-04-22.dahlia' });
    this.webhookSecret = whSecret;
    this.currency = config.payments.currency;
  }

  async createIntent(input: {
    bookingId: string;
    amount: number;
    currency: string;
  }): Promise<PaymentIntentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: (input.currency ?? this.currency).toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { bookingId: input.bookingId },
    });
    return {
      providerPaymentId: intent.id,
      clientSecret: intent.client_secret,
      status: 'REQUIRES_PAYMENT',
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<PaymentEvent | null> {
    let event: StripeEvent;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      ) as unknown as StripeEvent;
    } catch (err) {
      this.logger.warn(`stripe webhook signature failed: ${(err as Error).message}`);
      throw err;
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as StripePaymentIntent;
        return {
          providerEventId: event.id,
          type: 'payment_succeeded',
          providerPaymentId: pi.id,
          rawPayload: { id: event.id, type: event.type, intentId: pi.id },
        };
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as StripePaymentIntent;
        return {
          providerEventId: event.id,
          type: 'payment_failed',
          providerPaymentId: pi.id,
          rawPayload: { id: event.id, type: event.type, intentId: pi.id },
        };
      }
      case 'charge.refunded': {
        const charge = event.data.object as StripeCharge;
        const intentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!intentId) return null;
        return {
          providerEventId: event.id,
          type: 'payment_refunded',
          providerPaymentId: intentId,
          rawPayload: { id: event.id, type: event.type, intentId },
        };
      }
      default:
        return null;
    }
  }
}
