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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async stats(actor) {
        const scope = actor.role === client_1.Role.ADMIN ? 'admin' : actor.role === client_1.Role.MANAGER ? 'manager' : 'customer';
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        if (scope === 'admin') {
            const [hotels, rooms, byStatus, totalsRow, monthly, upcoming] = await this.prisma.$transaction([
                this.prisma.hotel.count(),
                this.prisma.room.count(),
                this.prisma.$queryRaw `
            SELECT status::text AS status, COUNT(*)::bigint AS count
            FROM "Booking"
            GROUP BY status
          `,
                this.prisma.$queryRaw `
            SELECT COUNT(*)::bigint AS bookings,
                   COALESCE(SUM("totalPrice"), 0)::text AS revenue
            FROM "Booking"
            WHERE status = 'CONFIRMED'
          `,
                this.prisma.$queryRaw `
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
            ]);
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
        if (scope === 'manager') {
            const managerId = actor.sub;
            const [hotels, rooms, byStatus, totalsRow, monthly, upcoming] = await this.prisma.$transaction([
                this.prisma.hotel.count({ where: { managerId } }),
                this.prisma.room.count({ where: { roomType: { hotel: { managerId } } } }),
                this.prisma.$queryRaw `
            SELECT b.status::text AS status, COUNT(*)::bigint AS count
            FROM "Booking" b
            JOIN "Room" r ON r.id = b."roomId"
            JOIN "RoomType" rt ON rt.id = r."roomTypeId"
            JOIN "Hotel" h ON h.id = rt."hotelId"
            WHERE h."managerId" = ${managerId}
            GROUP BY 1
          `,
                this.prisma.$queryRaw `
            SELECT COUNT(*)::bigint AS bookings,
                   COALESCE(SUM(b."totalPrice"), 0)::text AS revenue
            FROM "Booking" b
            JOIN "Room" r ON r.id = b."roomId"
            JOIN "RoomType" rt ON rt.id = r."roomTypeId"
            JOIN "Hotel" h ON h.id = rt."hotelId"
            WHERE h."managerId" = ${managerId} AND b.status = 'CONFIRMED'
          `,
                this.prisma.$queryRaw `
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
            ]);
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
            this.prisma.$queryRaw `
        SELECT status::text AS status, COUNT(*)::bigint AS count
        FROM "Booking"
        WHERE "userId" = ${userId}
        GROUP BY 1
      `,
            this.prisma.$queryRaw `
        SELECT COUNT(*)::bigint AS bookings,
               COALESCE(SUM("totalPrice"), 0)::text AS spend
        FROM "Booking"
        WHERE "userId" = ${userId} AND status = 'CONFIRMED'
      `,
            this.prisma.$queryRaw `
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
/** Fill any missing months with zeros so charts have a contiguous series. */
function shapeMonthly(rows, start) {
    const byMonth = new Map(rows.map((r) => [
        monthKey(r.month),
        {
            bookings: finiteNum(Number(r.bookings)),
            revenue: finiteNum(Number(r.revenue ?? '0')),
        },
    ]));
    const result = [];
    const cursor = new Date(start);
    for (let i = 0; i < 12; i += 1) {
        const key = monthKey(cursor);
        const bucket = byMonth.get(key) ?? { bookings: 0, revenue: 0 };
        result.push({
            month: key,
            bookings: finiteNum(bucket.bookings),
            revenue: finiteNum(bucket.revenue),
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
}
function finiteNum(n) {
    return Number.isFinite(n) ? n : 0;
}
function monthKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
//# sourceMappingURL=dashboard.service.js.map