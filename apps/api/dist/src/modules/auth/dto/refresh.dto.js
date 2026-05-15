"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshDto = exports.refreshSchema = void 0;
const zod_1 = require("zod");
const create_zod_dto_1 = require("../../../common/zod/create-zod-dto");
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
class RefreshDto extends (0, create_zod_dto_1.createZodDto)(exports.refreshSchema) {
}
exports.RefreshDto = RefreshDto;
//# sourceMappingURL=refresh.dto.js.map