import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './env.schema';
import { AppConfigService } from './app-config.service';

/**
 * Global config module. Loads .env, validates against the Zod schema,
 * and exposes AppConfigService as the only allowed env accessor.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: (raw: Record<string, unknown>) => {
        const parsed = envSchema.safeParse(raw);
        if (!parsed.success) {
          const message = parsed.error.errors
            .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
            .join('\n');
          throw new Error(`Invalid environment configuration:\n${message}`);
        }
        return parsed.data;
      },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
