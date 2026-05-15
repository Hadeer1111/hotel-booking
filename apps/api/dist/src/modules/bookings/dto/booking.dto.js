"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBookingStatusDto = exports.ListBookingsDto = exports.CreateBookingDto = exports.updateBookingStatusSchema = exports.listBookingsSchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
const create_zod_dto_1 = require("../../../common/zod/create-zod-dto");
const pagination_1 = require("../../../common/pagination/pagination");
exports.createBookingSchema = zod_1.z
    .object({
    hotelId: zod_1.z.string().uuid(),
    roomTypeId: zod_1.z.string().uuid(),
    checkIn: zod_1.z.coerce.date(),
    checkOut: zod_1.z.coerce.date(),
    guestCount: zod_1.z.coerce.number().int().min(1).max(20),
})
    .refine((d) => d.checkOut > d.checkIn, {
    message: 'checkOut must be after checkIn',
    path: ['checkOut'],
})
    .refine((d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.checkIn >= today;
}, { message: 'checkIn must be today or later', path: ['checkIn'] });
exports.listBookingsSchema = pagination_1.paginationSchema.extend({
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
    hotelId: zod_1.z.string().uuid().optional(),
});
exports.updateBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['CONFIRMED', 'CANCELLED']),
});
class CreateBookingDto extends (0, create_zod_dto_1.createZodDto)(exports.createBookingSchema) {
}
exports.CreateBookingDto = CreateBookingDto;
class ListBookingsDto extends (0, create_zod_dto_1.createZodDto)(exports.listBookingsSchema) {
}
exports.ListBookingsDto = ListBookingsDto;
class UpdateBookingStatusDto extends (0, create_zod_dto_1.createZodDto)(exports.updateBookingStatusSchema) {
}
exports.UpdateBookingStatusDto = UpdateBookingStatusDto;
//# sourceMappingURL=booking.dto.js.map