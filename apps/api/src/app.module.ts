import { Module } from '@nestjs/common';
import { HealthController } from './common/health/health.controller';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
