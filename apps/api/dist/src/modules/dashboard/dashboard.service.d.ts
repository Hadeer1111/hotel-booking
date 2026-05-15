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
    bookingsByStatus: {
        status: string;
        count: number;
    }[];
    /** Last 12 months: [{ month: '2025-06', bookings, revenue }, ...] */
    revenueByMonth: {
        month: string;
        bookings: number;
        revenue: number;
    }[];
    upcomingBookings: number;
}
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    stats(actor: AuthUser): Promise<DashboardStats>;
}
