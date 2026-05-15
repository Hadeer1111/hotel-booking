import { type Booking, type Payment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { type Paginated } from '../../common/pagination/pagination';
import type { AuthUser } from '../auth/types';
import type { CreateBookingDto, ListBookingsDto, UpdateBookingStatusDto } from './dto/booking.dto';
export interface BookingWithPayment extends Booking {
    payment: Payment | null;
}
export interface CreatedBookingResult {
    booking: Booking;
    payment: Payment;
    clientSecret: string | null;
}
export declare class BookingsService {
    private readonly prisma;
    private readonly payments;
    private readonly logger;
    constructor(prisma: PrismaService, payments: PaymentsService);
    /**
     * Race-free booking creation.
     *
     * See README "Why SERIALIZABLE and FOR UPDATE SKIP LOCKED and the
     * exclusion constraint?" for the layered defence rationale.
     *
     * - SERIALIZABLE: protects the multi-statement transaction graph
     * - FOR UPDATE SKIP LOCKED: lets parallel bookings of the same RoomType
     *   pick *different* physical rooms instead of serialising on a single row
     * - booking_no_overlap exclusion constraint (migration 0003) makes
     *   double-booking impossible even if app logic regresses
     *
     * On Postgres serialization failures (40001) we retry up to 3 times with
     * exponential backoff before giving up.
     */
    create(dto: InstanceType<typeof CreateBookingDto>, actor: AuthUser): Promise<CreatedBookingResult>;
    private runCreate;
    list(query: InstanceType<typeof ListBookingsDto>, actor: AuthUser): Promise<Paginated<BookingWithPayment>>;
    findOne(id: string, actor: AuthUser): Promise<BookingWithPayment>;
    updateStatus(id: string, dto: InstanceType<typeof UpdateBookingStatusDto>, actor: AuthUser): Promise<Booking>;
    private assertCanView;
}
