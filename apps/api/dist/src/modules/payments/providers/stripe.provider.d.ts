import { AppConfigService } from '../../../config/app-config.service';
import type { PaymentEvent, PaymentIntentResult, PaymentsProvider } from '../payments-provider.interface';
/**
 * Real Stripe provider (test-mode keys). Currency is configured via STRIPE_CURRENCY;
 * we treat Booking.totalPrice as a decimal amount in that currency and convert to
 * minor units (cents) here at the boundary so the rest of the domain never sees
 * cents.
 */
export declare class StripePaymentsProvider implements PaymentsProvider {
    readonly name = "stripe";
    private readonly logger;
    private readonly stripe;
    private readonly webhookSecret;
    private readonly currency;
    constructor(config: AppConfigService);
    createIntent(input: {
        bookingId: string;
        amount: number;
        currency: string;
    }): Promise<PaymentIntentResult>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<PaymentEvent | null>;
}
