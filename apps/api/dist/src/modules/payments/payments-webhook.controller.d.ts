import type { Request } from 'express';
import { PaymentsService } from './payments.service';
interface RawBodyRequest extends Request {
    rawBody?: Buffer;
}
/**
 * Webhook receiver for the configured PaymentsProvider.
 * Mounted at /v1/payments/webhook. Signature verification + idempotency
 * are delegated to the provider strategy.
 *
 * NOTE: bodyParser is configured in main.ts to expose req.rawBody for
 * this route so Stripe.constructEvent receives the exact bytes Stripe
 * signed.
 */
export declare class PaymentsWebhookController {
    private readonly payments;
    private readonly logger;
    constructor(payments: PaymentsService);
    handle(req: RawBodyRequest, stripeSig: string | undefined, mockSig: string | undefined): Promise<{
        received: true;
        processed: boolean;
    }>;
}
export {};
