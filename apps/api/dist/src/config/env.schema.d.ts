import { z } from 'zod';
/**
 * Zod schema for every environment variable the API reads.
 * Validated once at boot so misconfiguration fails fast instead of at runtime.
 */
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_URL: z.ZodUnion<[z.ZodString, z.ZodString]>;
    JWT_ACCESS_SECRET: z.ZodString;
    JWT_ACCESS_TTL: z.ZodDefault<z.ZodString>;
    JWT_REFRESH_SECRET: z.ZodString;
    JWT_REFRESH_TTL: z.ZodDefault<z.ZodString>;
    BCRYPT_ROUNDS: z.ZodDefault<z.ZodNumber>;
    PAYMENTS_PROVIDER: z.ZodDefault<z.ZodEnum<["mock", "stripe"]>>;
    STRIPE_SECRET_KEY: z.ZodOptional<z.ZodString>;
    STRIPE_WEBHOOK_SECRET: z.ZodOptional<z.ZodString>;
    STRIPE_CURRENCY: z.ZodDefault<z.ZodString>;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    THROTTLE_TTL: z.ZodDefault<z.ZodNumber>;
    THROTTLE_LIMIT: z.ZodDefault<z.ZodNumber>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["fatal", "error", "warn", "info", "debug", "trace"]>>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    DATABASE_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_ACCESS_TTL: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_TTL: string;
    BCRYPT_ROUNDS: number;
    PAYMENTS_PROVIDER: "mock" | "stripe";
    STRIPE_CURRENCY: string;
    CORS_ORIGIN: string;
    THROTTLE_TTL: number;
    THROTTLE_LIMIT: number;
    LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
}, {
    DATABASE_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    PORT?: number | undefined;
    JWT_ACCESS_TTL?: string | undefined;
    JWT_REFRESH_TTL?: string | undefined;
    BCRYPT_ROUNDS?: number | undefined;
    PAYMENTS_PROVIDER?: "mock" | "stripe" | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    STRIPE_CURRENCY?: string | undefined;
    CORS_ORIGIN?: string | undefined;
    THROTTLE_TTL?: number | undefined;
    THROTTLE_LIMIT?: number | undefined;
    LOG_LEVEL?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
