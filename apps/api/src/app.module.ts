import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './common/health/health.controller';

@Module({
  imports: [AppConfigModule, PrismaModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
