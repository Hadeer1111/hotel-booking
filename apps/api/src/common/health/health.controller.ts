import { Controller, Get, HttpCode } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller({ path: 'health', version: '1' })
@SkipThrottle()
export class HealthController {
  @Get()
  @HttpCode(200)
  check(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
