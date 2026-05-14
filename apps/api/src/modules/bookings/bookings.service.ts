import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, type Booking, type Payment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { toPaginated, toSkipTake, type Paginated } from '../../common/pagination/pagination';
import type { AuthUser } from '../auth/types';
import type {
  CreateBookingDto,
  ListBookingsDto,
  UpdateBookingStatusDto,
} from './dto/booking.dto';

export interface BookingWithPayment extends Booking {
  payment: Payment | null;
}

export interface CreatedBookingResult {
  booking: Booking;
  payment: Payment;
  clientSecret: string | null;
}

const SERIALIZATION_FAILURE = '40001';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

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
  async create(
    dto: InstanceType<typeof CreateBookingDto>,
    actor: AuthUser,
  ): Promise<CreatedBookingResult> {
    const nights = nightsBetween(dto.checkIn, dto.checkOut);
    if (nights <= 0) throw new BadRequestException('booking must span at least one night');

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await this.runCreate(dto, actor, nights);
      } catch (err: unknown) {
        if (isSerializationFailure(err) && attempt < 2) {
          attempt += 1;
          const wait = 25 * 2 ** attempt;
          this.logger.warn(`serialization failure, retrying attempt ${attempt} in ${wait}ms`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        if (isExclusionViolation(err)) {
          throw new ConflictException('NO_AVAILABILITY');
        }
        throw err;
      }
    }
  }

  private async runCreate(
    dto: InstanceType<typeof CreateBookingDto>,
    actor: AuthUser,
    nights: number,
  ): Promise<CreatedBookingResult> {
    return this.prisma.$transaction(
      async (tx) => {
        const rt = await tx.roomType.findFirst({
          where: { id: dto.roomTypeId, hotelId: dto.hotelId },
          select: { id: true, capacity: true, basePricePerNight: true },
        });
        if (!rt) throw new NotFoundException('room type not found in hotel');
        if (dto.guestCount > rt.capacity) {
          throw new BadRequestException(`guest count exceeds capacity (${rt.capacity})`);
        }

        const rows = await tx.$queryRaw<{ id: string }[]>`
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
        if (rows.length === 0 || !rows[0]) throw new ConflictException('NO_AVAILABILITY');
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
        const { payment, intent } = await this.payments.createForBooking(
          { bookingId: booking.id, amount: totalPrice },
          tx,
        );

        return { booking, payment, clientSecret: intent.clientSecret };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10_000 },
    );
  }

  // ---- Listing / detail / status transitions -----------------------------------------------

  async list(query: InstanceType<typeof ListBookingsDto>, actor: AuthUser): Promise<Paginated<BookingWithPayment>> {
    const where: Prisma.BookingWhereInput = {};
    if (query.status) where.status = query.status;

    // role-scoped visibility
    if (actor.role === Role.CUSTOMER) {
      where.userId = actor.sub;
    } else if (actor.role === Role.MANAGER) {
      where.room = { roomType: { hotel: { managerId: actor.sub } } };
      if (query.hotelId) where.room = { roomType: { hotelId: query.hotelId } };
    } else if (query.hotelId) {
      where.room = { roomType: { hotelId: query.hotelId } };
    }

    const { skip, take } = toSkipTake(query);
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

    return toPaginated(data, total, query);
  }

  async findOne(id: string, actor: AuthUser): Promise<BookingWithPayment> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        payment: true,
        room: { include: { roomType: { include: { hotel: true } } } },
      },
    });
    if (!booking) throw new NotFoundException('booking not found');
    this.assertCanView(booking, actor);
    return booking;
  }

  async updateStatus(
    id: string,
    dto: InstanceType<typeof UpdateBookingStatusDto>,
    actor: AuthUser,
  ): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { room: { include: { roomType: { include: { hotel: true } } } } },
    });
    if (!booking) throw new NotFoundException('booking not found');

    const isAdmin = actor.role === Role.ADMIN;
    const isOwningManager =
      actor.role === Role.MANAGER && booking.room.roomType.hotel.managerId === actor.sub;
    const isOwnerCustomer = actor.role === Role.CUSTOMER && booking.userId === actor.sub;

    const next = dto.status;

    // State machine:
    //   PENDING   -> CONFIRMED (admin/manager only)
    //   PENDING   -> CANCELLED (any visible party)
    //   CONFIRMED -> CANCELLED (admin/manager, or owner customer)
    //   CANCELLED -> *         (forbidden)
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('cancelled bookings are terminal');
    }
    if (next === 'CONFIRMED') {
      if (booking.status !== 'PENDING') {
        throw new BadRequestException(`cannot CONFIRM from ${booking.status}`);
      }
      if (!(isAdmin || isOwningManager)) throw new ForbiddenException('admin or manager required');
    } else if (next === 'CANCELLED') {
      if (!(isAdmin || isOwningManager || isOwnerCustomer)) {
        throw new ForbiddenException('not allowed to cancel');
      }
    }

    return this.prisma.booking.update({ where: { id }, data: { status: next } });
  }

  private assertCanView(
    booking: BookingWithPayment & {
      room: { roomType: { hotel: { managerId: string | null } } };
    },
    actor: AuthUser,
  ): void {
    if (actor.role === Role.ADMIN) return;
    if (actor.role === Role.CUSTOMER && booking.userId === actor.sub) return;
    if (actor.role === Role.MANAGER && booking.room.roomType.hotel.managerId === actor.sub) return;
    throw new ForbiddenException('not allowed to view this booking');
  }
}

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function isSerializationFailure(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
}

function isExclusionViolation(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  // Postgres exclusion violation is SQLSTATE 23P01.
  // Prisma surfaces it as P2010 with the underlying code in meta.code.
  return (
    err.code === 'P2010' &&
    typeof err.meta?.code === 'string' &&
    (err.meta.code === '23P01' || err.meta.code === SERIALIZATION_FAILURE)
  );
}
