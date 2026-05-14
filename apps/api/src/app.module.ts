import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { HealthController } from './common/health/health.controller';

@Module({
  imports: [AppConfigModule, PrismaModule, AuthModule, HotelsModule, RoomsModule, PaymentsModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
