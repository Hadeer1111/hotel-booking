"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityQueryDto = exports.UpdateRoomDto = exports.CreateRoomDto = exports.availabilityQuerySchema = exports.updateRoomSchema = exports.createRoomSchema = void 0;
const zod_1 = require("zod");
const create_zod_dto_1 = require("../../../common/zod/create-zod-dto");
exports.createRoomSchema = zod_1.z.object({
    roomTypeId: zod_1.z.string().uuid(),
    roomNumber: zod_1.z.string().min(1).max(20),
});
exports.updateRoomSchema = exports.createRoomSchema.partial();
exports.availabilityQuerySchema = zod_1.z
    .object({
    checkIn: zod_1.z.coerce.date(),
    checkOut: zod_1.z.coerce.date(),
})
    .refine((d) => d.checkOut > d.checkIn, {
    message: 'checkOut must be after checkIn',
    path: ['checkOut'],
});
class CreateRoomDto extends (0, create_zod_dto_1.createZodDto)(exports.createRoomSchema) {
}
exports.CreateRoomDto = CreateRoomDto;
class UpdateRoomDto extends (0, create_zod_dto_1.createZodDto)(exports.updateRoomSchema) {
}
exports.UpdateRoomDto = UpdateRoomDto;
class AvailabilityQueryDto extends (0, create_zod_dto_1.createZodDto)(exports.availabilityQuerySchema) {
}
exports.AvailabilityQueryDto = AvailabilityQueryDto;
//# sourceMappingURL=room.dto.js.map