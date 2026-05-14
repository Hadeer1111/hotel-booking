import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
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
@Controller({ path: 'payments', version: '1' })
@SkipThrottle()
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(private readonly payments: PaymentsService) {}

  @Post('webhook')
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') stripeSig: string | undefined,
    @Headers('x-mock-signature') mockSig: string | undefined,
  ): Promise<{ received: true; processed: boolean }> {
    const signature = stripeSig ?? mockSig;
    if (!signature) throw new BadRequestException('missing signature header');
    if (!req.rawBody) throw new BadRequestException('missing raw body');

    let event;
    try {
      event = await this.payments.verifyAndParseWebhook(req.rawBody, signature);
    } catch (err) {
      this.logger.warn(`webhook verification failed: ${(err as Error).message}`);
      throw new BadRequestException('invalid signature');
    }
    if (!event) return { received: true, processed: false };

    await this.payments.processEvent(event);
    return { received: true, processed: true };
  }
}
