import { z } from 'zod';
import { createZodDto } from '../../../common/zod/create-zod-dto';
import { createRoomSchema } from './room.dto';

/** Query for task-style `GET /v1/rooms?hotelId=…` */
export const listRoomsFlatQuerySchema = z.object({
  hotelId: z.string().uuid(),
});

/** Body for task-style `POST /v1/rooms` (hotelId in body vs nested route). */
export const createRoomFlatSchema = createRoomSchema.extend({
  hotelId: z.string().uuid(),
});

export class ListRoomsFlatQueryDto extends createZodDto(listRoomsFlatQuerySchema) {}
export class CreateRoomFlatDto extends createZodDto(createRoomFlatSchema) {}
