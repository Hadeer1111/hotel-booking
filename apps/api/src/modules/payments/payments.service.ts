import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Payment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import {
  PAYMENTS_PROVIDER,
  type PaymentEvent,
  type PaymentIntentResult,
  type PaymentsProvider,
} from './payments-provider.interface';

/**
 * Orchestrates the provider abstraction. Booking flows call createForBooking
 * to mint a Payment row and matching provider intent; webhooks call
 * processEvent to apply the event idempotently via PaymentEvent.providerEventId.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    @Inject(PAYMENTS_PROVIDER) private readonly provider: PaymentsProvider,
  ) {}

  /** Used by the bookings module right after the booking row is inserted. */
  async createForBooking(input: {
    bookingId: string;
    amount: number;
    currency?: string;
  }): Promise<{ payment: Payment; intent: PaymentIntentResult }> {
    const currency = input.currency ?? this.config.payments.currency;
    const intent = await this.provider.createIntent({
      bookingId: input.bookingId,
      amount: input.amount,
      currency,
    });
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: input.bookingId,
        provider: this.provider.name,
        providerPaymentId: intent.providerPaymentId,
        amount: input.amount,
        currency,
        status: intent.status,
      },
    });
    return { payment, intent };
  }

  async verifyAndParseWebhook(rawBody: Buffer, signature: string): Promise<PaymentEvent | null> {
    return this.provider.handleWebhook(rawBody, signature);
  }

  /** Idempotently apply a verified provider event. */
  async processEvent(event: PaymentEvent): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.paymentEvent.findUnique({
        where: { providerEventId: event.providerEventId },
        select: { id: true },
      });
      if (existing) {
        this.logger.debug(`event ${event.providerEventId} already processed; skipping`);
        return;
      }
      const payment = await tx.payment.findFirst({
        where: { providerPaymentId: event.providerPaymentId },
      });
      if (!payment) {
        throw new NotFoundException(
          `no payment found for providerPaymentId=${event.providerPaymentId}`,
        );
      }
      const nextStatus =
        event.type === 'payment_succeeded'
          ? 'SUCCEEDED'
          : event.type === 'payment_failed'
            ? 'FAILED'
            : 'REFUNDED';
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: nextStatus,
          providerEventLastSeen: event.providerEventId,
        },
      });
      if (event.type === 'payment_succeeded') {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' },
        });
      } else if (event.type === 'payment_refunded') {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CANCELLED' },
        });
      }
      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          providerEventId: event.providerEventId,
          type: event.type,
          payload: event.rawPayload as unknown as object,
        },
      });
    });
  }
}
