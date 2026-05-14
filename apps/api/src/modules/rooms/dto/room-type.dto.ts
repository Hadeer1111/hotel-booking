import { z } from 'zod';
import { createZodDto } from '../../../common/zod/create-zod-dto';

export const createRoomTypeSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  capacity: z.coerce.number().int().min(1).max(20),
  basePricePerNight: z.coerce.number().nonnegative().max(100_000),
});

export const updateRoomTypeSchema = createRoomTypeSchema.partial();

export class CreateRoomTypeDto extends createZodDto(createRoomTypeSchema) {}
export class UpdateRoomTypeDto extends createZodDto(updateRoomTypeSchema) {}
