"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDto = exports.registerSchema = void 0;
const zod_1 = require("zod");
const create_zod_dto_1 = require("../../../common/zod/create-zod-dto");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
    password: zod_1.z
        .string()
        .min(8, 'password must be at least 8 characters')
        .max(72, 'password must be at most 72 characters'),
    name: zod_1.z.string().min(1).max(100),
    role: zod_1.z.enum(['CUSTOMER', 'MANAGER']).optional(),
});
class RegisterDto extends (0, create_zod_dto_1.createZodDto)(exports.registerSchema) {
}
exports.RegisterDto = RegisterDto;
//# sourceMappingURL=register.dto.js.map