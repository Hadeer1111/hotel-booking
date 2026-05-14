import { Module } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { PaymentsService } from './payments.service';
import { PAYMENTS_PROVIDER, type PaymentsProvider } from './payments-provider.interface';
import { MockPaymentsProvider } from './providers/mock.provider';

@Module({
  providers: [
    PaymentsService,
    MockPaymentsProvider,
    {
      provide: PAYMENTS_PROVIDER,
      inject: [AppConfigService, MockPaymentsProvider],
      useFactory: (
        config: AppConfigService,
        mock: MockPaymentsProvider,
      ): PaymentsProvider => {
        if (config.payments.provider === 'stripe') {
          throw new Error(
            'PAYMENTS_PROVIDER=stripe but StripePaymentsProvider is not yet registered. Will be wired in a follow-up commit.',
          );
        }
        return mock;
      },
    },
  ],
  exports: [PaymentsService, PAYMENTS_PROVIDER],
})
export class PaymentsModule {}
