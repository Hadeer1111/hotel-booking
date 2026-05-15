"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRoomTypeDto = exports.CreateRoomTypeDto = exports.updateRoomTypeSchema = exports.createRoomTypeSchema = void 0;
const zod_1 = require("zod");
const create_zod_dto_1 = require("../../../common/zod/create-zod-dto");
exports.createRoomTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(80),
    description: zod_1.z.string().max(500).optional(),
    capacity: zod_1.z.coerce.number().int().min(1).max(20),
    basePricePerNight: zod_1.z.coerce.number().nonnegative().max(100_000),
});
exports.updateRoomTypeSchema = exports.createRoomTypeSchema.partial();
class CreateRoomTypeDto extends (0, create_zod_dto_1.createZodDto)(exports.createRoomTypeSchema) {
}
exports.CreateRoomTypeDto = CreateRoomTypeDto;
class UpdateRoomTypeDto extends (0, create_zod_dto_1.createZodDto)(exports.updateRoomTypeSchema) {
}
exports.UpdateRoomTypeDto = UpdateRoomTypeDto;
//# sourceMappingURL=room-type.dto.js.map