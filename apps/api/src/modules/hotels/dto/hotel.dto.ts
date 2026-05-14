import { z } from 'zod';
import { createZodDto } from '../../../common/zod/create-zod-dto';
import { paginationSchema } from '../../../common/pagination/pagination';

export const createHotelSchema = z.object({
  name: z.string().min(1).max(120),
  city: z.string().min(1).max(80),
  address: z.string().min(1).max(255),
  stars: z.coerce.number().int().min(1).max(5),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  managerId: z.string().uuid().optional(),
});

export const updateHotelSchema = createHotelSchema.partial();

export const listHotelsSchema = paginationSchema.extend({
  q: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().min(1).max(80).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export class CreateHotelDto extends createZodDto(createHotelSchema) {}
export class UpdateHotelDto extends createZodDto(updateHotelSchema) {}
export class ListHotelsDto extends createZodDto(listHotelsSchema) {}
