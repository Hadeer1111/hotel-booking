import { z } from 'zod';
import { createZodDto } from '../../../common/zod/create-zod-dto';
import { paginationSchema } from '../../../common/pagination/pagination';

export const createBookingSchema = z
  .object({
    hotelId: z.string().uuid(),
    roomTypeId: z.string().uuid(),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    guestCount: z.coerce.number().int().min(1).max(20),
  })
  .refine((d) => d.checkOut > d.checkIn, {
    message: 'checkOut must be after checkIn',
    path: ['checkOut'],
  })
  .refine(
    (d) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d.checkIn >= today;
    },
    { message: 'checkIn must be today or later', path: ['checkIn'] },
  );

export const listBookingsSchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  hotelId: z.string().uuid().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
});

export class CreateBookingDto extends createZodDto(createBookingSchema) {}
export class ListBookingsDto extends createZodDto(listBookingsSchema) {}
export class UpdateBookingStatusDto extends createZodDto(updateBookingStatusSchema) {}
