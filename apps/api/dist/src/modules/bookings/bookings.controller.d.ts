import { BookingsService } from './bookings.service';
import { CreateBookingDto, ListBookingsDto, UpdateBookingStatusDto } from './dto/booking.dto';
import type { AuthUser } from '../auth/types';
export declare class BookingsController {
    private readonly bookings;
    constructor(bookings: BookingsService);
    create(dto: InstanceType<typeof CreateBookingDto>, actor: AuthUser): Promise<import("./bookings.service").CreatedBookingResult>;
    list(query: InstanceType<typeof ListBookingsDto>, actor: AuthUser): Promise<import("../../common/pagination/pagination").Paginated<import("./bookings.service").BookingWithPayment>>;
    findOne(id: string, actor: AuthUser): Promise<import("./bookings.service").BookingWithPayment>;
    updateStatus(id: string, dto: InstanceType<typeof UpdateBookingStatusDto>, actor: AuthUser): Promise<{
        status: import("@prisma/client").$Enums.BookingStatus;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        checkIn: Date;
        checkOut: Date;
        roomId: string;
        guestCount: number;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
    }>;
}
