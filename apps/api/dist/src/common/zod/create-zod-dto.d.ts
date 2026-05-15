import type { ZodSchema, ZodTypeAny, z } from 'zod';
/**
 * Minimal Zod-to-DTO helper. Returns a class with a static parse() and an
 * instance shaped like the schema's inferred type. Used by ZodValidationPipe.
 */
export declare function createZodDto<T extends ZodTypeAny>(schema: T): {
    new (): z.infer<T>;
    schema: ZodSchema;
    parse(input: unknown): z.infer<T>;
};
