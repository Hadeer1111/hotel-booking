"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZodDto = createZodDto;
const common_1 = require("@nestjs/common");
/**
 * Minimal Zod-to-DTO helper. Returns a class with a static parse() and an
 * instance shaped like the schema's inferred type. Used by ZodValidationPipe.
 */
function createZodDto(schema) {
    class AugmentedZodDto {
        static { this.schema = schema; }
        static parse(input) {
            const parsed = schema.safeParse(input);
            if (!parsed.success) {
                throw new common_1.BadRequestException({
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
    return AugmentedZodDto;
}
//# sourceMappingURL=create-zod-dto.js.map