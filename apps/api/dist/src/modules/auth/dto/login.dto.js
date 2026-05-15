"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginDto = exports.loginSchema = void 0;
const zod_1 = require("zod");
const create_zod_dto_1 = require("../../../common/zod/create-zod-dto");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
    password: zod_1.z.string().min(1).max(72),
});
class LoginDto extends (0, create_zod_dto_1.createZodDto)(exports.loginSchema) {
}
exports.LoginDto = LoginDto;
//# sourceMappingURL=login.dto.js.map