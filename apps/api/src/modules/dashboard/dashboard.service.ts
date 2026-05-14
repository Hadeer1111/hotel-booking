import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../auth/types';

export interface DashboardStats {
  scope: 'admin' | 'manager' | 'customer';
  totals: {
    hotels: number;
    rooms: number;
    bookings: number;
    revenue: number;
  };
  bookingsByStatus: { status: string; count: number }[];
  /** Last 12 months: [{ month: '2025-06', bookings, revenue }, ...] */
  revenueByMonth: { month: string; bookings: number; revenue: number }[];
  upcomingBookings: number;
}

interface MonthlyRow {
  month: Date;
  bookings: bigint;
  revenue: string | null;
}

interface StatusRow {
  status: string;
  count: bigint;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(actor: AuthUser): Promise<DashboardStats> {
    const scope =
      actor.role === Role.ADMIN ? 'admin' : actor.role === Role.MANAGER ? 'manager' : 'customer';
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    if (scope === 'admin') {
      const [hotels, rooms, byStatus, totalsRow, monthly, upcoming] = await this.prisma.$transaction(
        [
          this.prisma.hotel.count(),
          this.prisma.room.count(),
          this.prisma.$queryRaw<StatusRow[]>`
            SELECT status::text AS status, COUNT(*)::bigint AS count
            FROM "Booking"
            GROUP BY status
          `,
          this.prisma.$queryRaw<
            { bookings: bigint; revenue: string | null }[]
          >`
            SELECT COUNT(*)::bigint AS bookings,
                   COALESCE(SUM("totalPrice"), 0)::text AS revenue
            FROM "Booking"
            WHERE status = 'CONFIRMED'
          `,
          this.prisma.$queryRaw<MonthlyRow[]>`
            SELECT date_trunc('month', "createdAt") AS month,
                   COUNT(*)::bigint AS bookings,
                   COALESCE(SUM("totalPrice"), 0)::text AS revenue
            FROM "Booking"
            WHERE "createdAt" >= ${twelveMonthsAgo}
              AND status IN ('PENDING','CONFIRMED')
            GROUP BY 1
            ORDER BY 1 ASC
          `,
          this.prisma.booking.count({
            where: { status: { in: ['PENDING', 'CONFIRMED'] }, checkIn: { gte: now } },
          }),
        ],
      );
      const totalsBucket = totalsRow[0] ?? { bookings: 0n, revenue: '0' };
      const totalBookings =
        byStatus.reduce((acc, r) => acc + Number(r.count), 0);
      return {
        scope,
        totals: {
          hotels,
          rooms,
          bookings: totalBookings,
          revenue: Number(totalsBucket.revenue ?? '0'),
        },
        bookingsByStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
        revenueByMonth: shapeMonthly(monthly, twelveMonthsAgo),
        upcomingBookings: upcoming,
      };
    }

    if (scope === 'manager') {
      const managerId = actor.sub;
      const [hotels, rooms, byStatus, totalsRow, monthly, upcoming] = await this.prisma.$transaction(
        [
          this.prisma.hotel.count({ where: { managerId } }),
          this.prisma.room.count({ where: { roomType: { hotel: { managerId } } } }),
          this.prisma.$queryRaw<StatusRow[]>`
            SELECT b.status::text AS status, COUNT(*)::bigint AS count
            FROM "Booking" b
            JOIN "Room" r ON r.id = b."roomId"
            JOIN "RoomType" rt ON rt.id = r."roomTypeId"
            JOIN "Hotel" h ON h.id = rt."hotelId"
            WHERE h."managerId" = ${managerId}
            GROUP BY 1
          `,
          this.prisma.$queryRaw<
            { bookings: bigint; revenue: string | null }[]
          >`
            SELECT COUNT(*)::bigint AS bookings,
                   COALESCE(SUM(b."totalPrice"), 0)::text AS revenue
            FROM "Booking" b
            JOIN "Room" r ON r.id = b."roomId"
            JOIN "RoomType" rt ON rt.id = r."roomTypeId"
            JOIN "Hotel" h ON h.id = rt."hotelId"
            WHERE h."managerId" = ${managerId} AND b.status = 'CONFIRMED'
          `,
          this.prisma.$queryRaw<MonthlyRow[]>`
            SELECT date_trunc('month', b."createdAt") AS month,
                   COUNT(*)::bigint AS bookings,
                   COALESCE(SUM(b."totalPrice"), 0)::text AS revenue
            FROM "Booking" b
            JOIN "Room" r ON r.id = b."roomId"
            JOIN "RoomType" rt ON rt.id = r."roomTypeId"
            JOIN "Hotel" h ON h.id = rt."hotelId"
            WHERE h."managerId" = ${managerId}
              AND b."createdAt" >= ${twelveMonthsAgo}
              AND b.status IN ('PENDING','CONFIRMED')
            GROUP BY 1
            ORDER BY 1 ASC
          `,
          this.prisma.booking.count({
            where: {
              room: { roomType: { hotel: { managerId } } },
              status: { in: ['PENDING', 'CONFIRMED'] },
              checkIn: { gte: now },
            },
          }),
        ],
      );
      const totalsBucket = totalsRow[0] ?? { bookings: 0n, revenue: '0' };
      const totalBookings = byStatus.reduce((acc, r) => acc + Number(r.count), 0);
      return {
        scope,
        totals: {
          hotels,
          rooms,
          bookings: totalBookings,
          revenue: Number(totalsBucket.revenue ?? '0'),
        },
        bookingsByStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
        revenueByMonth: shapeMonthly(monthly, twelveMonthsAgo),
        upcomingBookings: upcoming,
      };
    }

    // CUSTOMER
    const userId = actor.sub;
    const [byStatus, totalsRow, monthly, upcoming] = await this.prisma.$transaction([
      this.prisma.$queryRaw<StatusRow[]>`
        SELECT status::text AS status, COUNT(*)::bigint AS count
        FROM "Booking"
        WHERE "userId" = ${userId}
        GROUP BY 1
      `,
      this.prisma.$queryRaw<{ bookings: bigint; spend: string | null }[]>`
        SELECT COUNT(*)::bigint AS bookings,
               COALESCE(SUM("totalPrice"), 0)::text AS spend
        FROM "Booking"
        WHERE "userId" = ${userId} AND status = 'CONFIRMED'
      `,
      this.prisma.$queryRaw<MonthlyRow[]>`
        SELECT date_trunc('month', "createdAt") AS month,
               COUNT(*)::bigint AS bookings,
               COALESCE(SUM("totalPrice"), 0)::text AS revenue
        FROM "Booking"
        WHERE "userId" = ${userId}
          AND "createdAt" >= ${twelveMonthsAgo}
          AND status IN ('PENDING','CONFIRMED')
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      this.prisma.booking.count({
        where: { userId, status: { in: ['PENDING', 'CONFIRMED'] }, checkIn: { gte: now } },
      }),
    ]);
    const totalsBucket = totalsRow[0] ?? { bookings: 0n, spend: '0' };
    const totalBookings = byStatus.reduce((acc, r) => acc + Number(r.count), 0);
    return {
      scope,
      totals: {
        hotels: 0,
        rooms: 0,
        bookings: totalBookings,
        revenue: Number(totalsBucket.spend ?? '0'),
      },
      bookingsByStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
      revenueByMonth: shapeMonthly(monthly, twelveMonthsAgo),
      upcomingBookings: upcoming,
    };
  }
}

/** Fill any missing months with zeros so charts have a contiguous series. */
function shapeMonthly(
  rows: MonthlyRow[],
  start: Date,
): { month: string; bookings: number; revenue: number }[] {
  const byMonth = new Map(
    rows.map((r) => [
      monthKey(r.month),
      { bookings: Number(r.bookings), revenue: Number(r.revenue ?? '0') },
    ]),
  );
  const result: { month: string; bookings: number; revenue: number }[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < 12; i += 1) {
    const key = monthKey(cursor);
    const bucket = byMonth.get(key) ?? { bookings: 0, revenue: 0 };
    result.push({ month: key, ...bucket });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
