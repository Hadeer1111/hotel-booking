import { BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodTypeAny, z } from 'zod';

/**
 * Minimal Zod-to-DTO helper. Returns a class with a static parse() and an
 * instance shaped like the schema's inferred type. Used by ZodValidationPipe.
 */
export function createZodDto<T extends ZodTypeAny>(
  schema: T,
): {
  new (): z.infer<T>;
  schema: ZodSchema;
  parse(input: unknown): z.infer<T>;
} {
  abstract class AugmentedZodDto {
    static schema = schema;
    static parse(input: unknown): z.infer<T> {
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        throw new BadRequestException({
          message: 'validation failed',
          errors: parsed.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return parsed.data as z.infer<T>;
    }
  }
  return AugmentedZodDto as unknown as {
    new (): z.infer<T>;
    schema: ZodSchema;
    parse(input: unknown): z.infer<T>;
  };
}
