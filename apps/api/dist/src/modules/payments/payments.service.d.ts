import { Prisma, type Payment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import { type PaymentEvent, type PaymentIntentResult, type PaymentsProvider } from './payments-provider.interface';
/**
 * Orchestrates the provider abstraction. Booking flows call createForBooking
 * to mint a Payment row and matching provider intent; webhooks call
 * processEvent to apply the event idempotently via PaymentEvent.providerEventId.
 */
export declare class PaymentsService {
    private readonly prisma;
    private readonly config;
    private readonly provider;
    private readonly logger;
    constructor(prisma: PrismaService, config: AppConfigService, provider: PaymentsProvider);
    /**
     * Used by the bookings module right after the booking row is inserted.
     *
     * CRITICAL: when the caller is already inside a `prisma.$transaction`,
     * it MUST pass the transaction client (`tx`) through. The Booking row is
     * still uncommitted at this point, so a default `this.prisma.payment.create`
     * call would run on a different pooled connection that cannot see the
     * booking yet, and Postgres would reject the insert with a
     * `Payment_bookingId_fkey` foreign-key violation.
     */
    createForBooking(input: {
        bookingId: string;
        amount: number;
        currency?: string;
    }, tx?: Prisma.TransactionClient): Promise<{
        payment: Payment;
        intent: PaymentIntentResult;
    }>;
    verifyAndParseWebhook(rawBody: Buffer, signature: string): Promise<PaymentEvent | null>;
    /** Idempotently apply a verified provider event. */
    processEvent(event: PaymentEvent): Promise<void>;
}
