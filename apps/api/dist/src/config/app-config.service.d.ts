import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema';
/**
 * Type-safe wrapper around ConfigService.
 * Use this everywhere instead of process.env or raw ConfigService so consumers
 * get a fully-typed view of the validated environment.
 */
export declare class AppConfigService {
    private readonly config;
    constructor(config: ConfigService<Env, true>);
    get<T extends keyof Env>(key: T): Env[T];
    get nodeEnv(): Env['NODE_ENV'];
    get isProd(): boolean;
    get isTest(): boolean;
    get jwt(): {
        accessSecret: string;
        accessTtl: string;
        refreshSecret: string;
        refreshTtl: string;
    };
    get payments(): {
        provider: Env['PAYMENTS_PROVIDER'];
        stripeSecretKey?: string;
        stripeWebhookSecret?: string;
        currency: string;
    };
    get throttle(): {
        ttl: number;
        limit: number;
    };
}
