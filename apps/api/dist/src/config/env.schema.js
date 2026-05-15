"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod schema for every environment variable the API reads.
 * Validated once at boot so misconfiguration fails fast instead of at runtime.
 */
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    DATABASE_URL: zod_1.z.string().url().or(zod_1.z.string().startsWith('postgres')),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
    JWT_ACCESS_TTL: zod_1.z.string().default('900s'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
    JWT_REFRESH_TTL: zod_1.z.string().default('7d'),
    BCRYPT_ROUNDS: zod_1.z.coerce.number().int().min(4).max(15).default(12),
    PAYMENTS_PROVIDER: zod_1.z.enum(['mock', 'stripe']).default('mock'),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    STRIPE_CURRENCY: zod_1.z.string().length(3).default('usd'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    THROTTLE_TTL: zod_1.z.coerce.number().int().positive().default(60),
    THROTTLE_LIMIT: zod_1.z.coerce.number().int().positive().default(20),
    LOG_LEVEL: zod_1.z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});
//# sourceMappingURL=env.schema.js.map