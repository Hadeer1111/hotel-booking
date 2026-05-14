import { z } from 'zod';
import { createZodDto } from '../../../common/zod/create-zod-dto';

export const createRoomSchema = z.object({
  roomTypeId: z.string().uuid(),
  roomNumber: z.string().min(1).max(20),
});

export const updateRoomSchema = createRoomSchema.partial();

export const availabilityQuerySchema = z
  .object({
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
  })
  .refine((d) => d.checkOut > d.checkIn, {
    message: 'checkOut must be after checkIn',
    path: ['checkOut'],
  });

export class CreateRoomDto extends createZodDto(createRoomSchema) {}
export class UpdateRoomDto extends createZodDto(updateRoomSchema) {}
export class AvailabilityQueryDto extends createZodDto(availabilityQuerySchema) {}
