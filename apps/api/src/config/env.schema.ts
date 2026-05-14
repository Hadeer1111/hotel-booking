import { z } from 'zod';

/**
 * Zod schema for every environment variable the API reads.
 * Validated once at boot so misconfiguration fails fast instead of at runtime.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url().or(z.string().startsWith('postgres')),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL: z.string().default('900s'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  PAYMENTS_PROVIDER: z.enum(['mock', 'stripe']).default('mock'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CURRENCY: z.string().length(3).default('usd'),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  THROTTLE_TTL: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(20),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;
