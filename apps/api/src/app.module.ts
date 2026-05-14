import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthController } from './common/health/health.controller';

@Module({
  imports: [AppConfigModule, PrismaModule, AuthModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
