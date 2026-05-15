"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BookingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const payments_service_1 = require("../payments/payments.service");
const pagination_1 = require("../../common/pagination/pagination");
const SERIALIZATION_FAILURE = '40001';
let BookingsService = BookingsService_1 = class BookingsService {
    constructor(prisma, payments) {
        this.prisma = prisma;
        this.payments = payments;
        this.logger = new common_1.Logger(BookingsService_1.name);
    }
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
    async create(dto, actor) {
        const nights = nightsBetween(dto.checkIn, dto.checkOut);
        if (nights <= 0)
            throw new common_1.BadRequestException('booking must span at least one night');
        let attempt = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                return await this.runCreate(dto, actor, nights);
            }
            catch (err) {
                if (isSerializationFailure(err) && attempt < 2) {
                    attempt += 1;
                    const wait = 25 * 2 ** attempt;
                    this.logger.warn(`serialization failure, retrying attempt ${attempt} in ${wait}ms`);
                    await new Promise((r) => setTimeout(r, wait));
                    continue;
                }
                if (isExclusionViolation(err)) {
                    throw new common_1.ConflictException('NO_AVAILABILITY');
                }
                throw err;
            }
        }
    }
    async runCreate(dto, actor, nights) {
        return this.prisma.$transaction(async (tx) => {
            const hotelOk = await tx.hotel.findUnique({
                where: { id: dto.hotelId },
                select: { id: true, status: true },
            });
            if (!hotelOk)
                throw new common_1.NotFoundException('hotel not found');
            if (hotelOk.status !== client_1.HotelStatus.ACTIVE) {
                throw new common_1.BadRequestException('hotel is inactive and cannot accept new bookings');
            }
            const rt = await tx.roomType.findFirst({
                where: { id: dto.roomTypeId, hotelId: dto.hotelId },
                select: { id: true, capacity: true, basePricePerNight: true },
            });
            if (!rt)
                throw new common_1.NotFoundException('room type not found in hotel');
            if (dto.guestCount > rt.capacity) {
                throw new common_1.BadRequestException(`guest count exceeds capacity (${rt.capacity})`);
            }
            const rows = await tx.$queryRaw `
          SELECT r.id FROM "Room" r
          WHERE r."roomTypeId" = ${rt.id}
            AND NOT EXISTS (
              SELECT 1 FROM "Booking" b
              WHERE b."roomId" = r.id
                AND b.status IN ('PENDING','CONFIRMED')
                AND tstzrange(b."checkIn", b."checkOut", '[)') &&
                    tstzrange(${dto.checkIn}::timestamptz, ${dto.checkOut}::timestamptz, '[)')
            )
          ORDER BY r."roomNumber" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `;
            if (rows.length === 0 || !rows[0])
                throw new common_1.ConflictException('NO_AVAILABILITY');
            const roomId = rows[0].id;
            const totalPrice = Number(rt.basePricePerNight) * nights;
            const booking = await tx.booking.create({
                data: {
                    userId: actor.sub,
                    roomId,
                    checkIn: dto.checkIn,
                    checkOut: dto.checkOut,
                    guestCount: dto.guestCount,
                    totalPrice,
                },
            });
            // IMPORTANT: pass `tx` so the Payment INSERT runs on the same
            // connection as the still-uncommitted Booking, otherwise the FK
            // constraint Payment_bookingId_fkey fails.
            const { payment, intent } = await this.payments.createForBooking({ bookingId: booking.id, amount: totalPrice }, tx);
            return { booking, payment, clientSecret: intent.clientSecret };
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, timeout: 10_000 });
    }
    // ---- Listing / detail / status transitions -----------------------------------------------
    async list(query, actor) {
        const where = {};
        if (query.status)
            where.status = query.status;
        // role-scoped visibility
        if (actor.role === client_1.Role.CUSTOMER) {
            where.userId = actor.sub;
        }
        else if (actor.role === client_1.Role.MANAGER) {
            where.room = { roomType: { hotel: { managerId: actor.sub } } };
            if (query.hotelId)
                where.room = { roomType: { hotelId: query.hotelId } };
        }
        else if (query.hotelId) {
            where.room = { roomType: { hotelId: query.hotelId } };
        }
        const { skip, take } = (0, pagination_1.toSkipTake)(query);
        const [data, total] = await this.prisma.$transaction([
            this.prisma.booking.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: { payment: true },
            }),
            this.prisma.booking.count({ where }),
        ]);
        return (0, pagination_1.toPaginated)(data, total, query);
    }
    async findOne(id, actor) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: {
                payment: true,
                room: { include: { roomType: { include: { hotel: true } } } },
            },
        });
        if (!booking)
            throw new common_1.NotFoundException('booking not found');
        this.assertCanView(booking, actor);
        return booking;
    }
    async updateStatus(id, dto, actor) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: { room: { include: { roomType: { include: { hotel: true } } } } },
        });
        if (!booking)
            throw new common_1.NotFoundException('booking not found');
        const isAdmin = actor.role === client_1.Role.ADMIN;
        const isOwningManager = actor.role === client_1.Role.MANAGER && booking.room.roomType.hotel.managerId === actor.sub;
        const isOwnerCustomer = actor.role === client_1.Role.CUSTOMER && booking.userId === actor.sub;
        const next = dto.status;
        // State machine:
        //   PENDING   -> CONFIRMED (admin/manager only)
        //   PENDING   -> CANCELLED (any visible party)
        //   CONFIRMED -> CANCELLED (admin/manager, or owner customer)
        //   CANCELLED -> *         (forbidden)
        if (booking.status === 'CANCELLED') {
            throw new common_1.BadRequestException('cancelled bookings are terminal');
        }
        if (next === 'CONFIRMED') {
            if (booking.status !== 'PENDING') {
                throw new common_1.BadRequestException(`cannot CONFIRM from ${booking.status}`);
            }
            if (!(isAdmin || isOwningManager))
                throw new common_1.ForbiddenException('admin or manager required');
        }
        else if (next === 'CANCELLED') {
            if (!(isAdmin || isOwningManager || isOwnerCustomer)) {
                throw new common_1.ForbiddenException('not allowed to cancel');
            }
        }
        return this.prisma.booking.update({ where: { id }, data: { status: next } });
    }
    assertCanView(booking, actor) {
        if (actor.role === client_1.Role.ADMIN)
            return;
        if (actor.role === client_1.Role.CUSTOMER && booking.userId === actor.sub)
            return;
        if (actor.role === client_1.Role.MANAGER && booking.room.roomType.hotel.managerId === actor.sub)
            return;
        throw new common_1.ForbiddenException('not allowed to view this booking');
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = BookingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payments_service_1.PaymentsService])
], BookingsService);
function nightsBetween(checkIn, checkOut) {
    const ms = checkOut.getTime() - checkIn.getTime();
    return Math.round(ms / (24 * 60 * 60 * 1000));
}
function isSerializationFailure(err) {
    return err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
}
function isExclusionViolation(err) {
    if (!(err instanceof client_1.Prisma.PrismaClientKnownRequestError))
        return false;
    // Postgres exclusion violation is SQLSTATE 23P01.
    // Prisma surfaces it as P2010 with the underlying code in meta.code.
    return (err.code === 'P2010' &&
        typeof err.meta?.code === 'string' &&
        (err.meta.code === '23P01' || err.meta.code === SERIALIZATION_FAILURE));
}
//# sourceMappingURL=bookings.service.js.map