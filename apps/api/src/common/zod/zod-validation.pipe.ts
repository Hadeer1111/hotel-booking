import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

interface ZodDtoConstructor {
  schema: ZodSchema;
}

/**
 * Body-validation pipe that delegates to the Zod schema attached to a DTO.
 * Use as `@Body(new ZodValidationPipe(MyDto)) dto: MyDto`.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly dto: ZodDtoConstructor) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const parsed = this.dto.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'validation failed',
        errors: parsed.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    return parsed.data;
  }
}
