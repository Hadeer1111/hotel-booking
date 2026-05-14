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
  // Accepts either `stars=4&stars=5` (array) or `stars=4,5` (CSV).
  // Coerces to a deduped sorted list of ints in [1, 5]; `undefined` if empty/invalid.
  stars: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      const raw = Array.isArray(v) ? v : v.split(',');
      const ints = raw
        .map((s) => Number.parseInt(String(s).trim(), 10))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
      return ints.length ? Array.from(new Set(ints)).sort((a, b) => a - b) : undefined;
    }),
});

export class CreateHotelDto extends createZodDto(createHotelSchema) {}
export class UpdateHotelDto extends createZodDto(updateHotelSchema) {}
export class ListHotelsDto extends createZodDto(listHotelsSchema) {}
