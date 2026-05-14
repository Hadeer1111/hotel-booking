import { Module } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { AuthModule } from '../auth/auth.module';
import { PaymentsService } from './payments.service';
import { PaymentsWebhookController } from './payments-webhook.controller';
import { PAYMENTS_PROVIDER, type PaymentsProvider } from './payments-provider.interface';
import { MockPaymentsProvider } from './providers/mock.provider';
import { StripePaymentsProvider } from './providers/stripe.provider';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsWebhookController],
  providers: [
    PaymentsService,
    MockPaymentsProvider,
    {
      provide: StripePaymentsProvider,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): StripePaymentsProvider | null =>
        config.payments.provider === 'stripe' ? new StripePaymentsProvider(config) : null,
    },
    {
      provide: PAYMENTS_PROVIDER,
      inject: [AppConfigService, MockPaymentsProvider, StripePaymentsProvider],
      useFactory: (
        config: AppConfigService,
        mock: MockPaymentsProvider,
        stripe: StripePaymentsProvider | null,
      ): PaymentsProvider => {
        if (config.payments.provider === 'stripe') {
          if (!stripe) throw new Error('Stripe provider not initialised');
          return stripe;
        }
        return mock;
      },
    },
  ],
  exports: [PaymentsService, PAYMENTS_PROVIDER],
})
export class PaymentsModule {}
