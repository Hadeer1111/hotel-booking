import { AppConfigService } from '../../../config/app-config.service';
import type { PaymentEvent, PaymentIntentResult, PaymentsProvider } from '../payments-provider.interface';
/**
 * Mock provider used by tests and `PAYMENTS_PROVIDER=mock`.
 * - createIntent returns a deterministic mock_pi_<uuid> + clientSecret null.
 * - Webhook signatures are produced by an HMAC over the body with a shared
 *   secret so we can still exercise the signature-verification code path.
 */
export declare class MockPaymentsProvider implements PaymentsProvider {
    readonly name = "mock";
    private readonly logger;
    private readonly webhookSecret;
    constructor(config: AppConfigService);
    createIntent(input: {
        bookingId: string;
        amount: number;
        currency: string;
    }): Promise<PaymentIntentResult>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<PaymentEvent | null>;
}
