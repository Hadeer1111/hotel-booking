import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema';

/**
 * Type-safe wrapper around ConfigService.
 * Use this everywhere instead of process.env or raw ConfigService so consumers
 * get a fully-typed view of the validated environment.
 */
@Injectable()
export class AppConfigService {
  constructor(@Inject(ConfigService) private readonly config: ConfigService<Env, true>) {}

  get<T extends keyof Env>(key: T): Env[T] {
    return this.config.get(key, { infer: true }) as Env[T];
  }

  get nodeEnv(): Env['NODE_ENV'] {
    return this.get('NODE_ENV');
  }

  get isProd(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get jwt(): {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  } {
    return {
      accessSecret: this.get('JWT_ACCESS_SECRET'),
      accessTtl: this.get('JWT_ACCESS_TTL'),
      refreshSecret: this.get('JWT_REFRESH_SECRET'),
      refreshTtl: this.get('JWT_REFRESH_TTL'),
    };
  }

  get payments(): {
    provider: Env['PAYMENTS_PROVIDER'];
    stripeSecretKey?: string;
    stripeWebhookSecret?: string;
    currency: string;
  } {
    return {
      provider: this.get('PAYMENTS_PROVIDER'),
      stripeSecretKey: this.get('STRIPE_SECRET_KEY'),
      stripeWebhookSecret: this.get('STRIPE_WEBHOOK_SECRET'),
      currency: this.get('STRIPE_CURRENCY'),
    };
  }

  get throttle(): { ttl: number; limit: number } {
    return { ttl: this.get('THROTTLE_TTL'), limit: this.get('THROTTLE_LIMIT') };
  }
}
