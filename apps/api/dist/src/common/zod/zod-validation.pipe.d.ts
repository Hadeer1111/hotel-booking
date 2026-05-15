import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';
interface ZodDtoConstructor {
    schema: ZodSchema;
}
/**
 * Body-validation pipe that delegates to the Zod schema attached to a DTO.
 * Use as `@Body(new ZodValidationPipe(MyDto)) dto: MyDto`.
 */
export declare class ZodValidationPipe implements PipeTransform {
    private readonly dto;
    constructor(dto: ZodDtoConstructor);
    transform(value: unknown, _metadata: ArgumentMetadata): unknown;
}
export {};
