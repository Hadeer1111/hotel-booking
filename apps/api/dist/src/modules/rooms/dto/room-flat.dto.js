"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRoomFlatDto = exports.ListRoomsFlatQueryDto = exports.createRoomFlatSchema = exports.listRoomsFlatQuerySchema = void 0;
const zod_1 = require("zod");
const create_zod_dto_1 = require("../../../common/zod/create-zod-dto");
const room_dto_1 = require("./room.dto");
/** Query for task-style `GET /v1/rooms?hotelId=…` */
exports.listRoomsFlatQuerySchema = zod_1.z.object({
    hotelId: zod_1.z.string().uuid(),
});
/** Body for task-style `POST /v1/rooms` (hotelId in body vs nested route). */
exports.createRoomFlatSchema = room_dto_1.createRoomSchema.extend({
    hotelId: zod_1.z.string().uuid(),
});
class ListRoomsFlatQueryDto extends (0, create_zod_dto_1.createZodDto)(exports.listRoomsFlatQuerySchema) {
}
exports.ListRoomsFlatQueryDto = ListRoomsFlatQueryDto;
class CreateRoomFlatDto extends (0, create_zod_dto_1.createZodDto)(exports.createRoomFlatSchema) {
}
exports.CreateRoomFlatDto = CreateRoomFlatDto;
//# sourceMappingURL=room-flat.dto.js.map