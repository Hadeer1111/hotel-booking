import { z } from 'zod';

// ---- Enums ----------------------------------------------------------------------------------

export const RoleSchema = z.enum(['ADMIN', 'MANAGER', 'CUSTOMER']);
export type Role = z.infer<typeof RoleSchema>;

export const HotelStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export type HotelStatus = z.infer<typeof HotelStatusSchema>;

export const BookingStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const PaymentStatusSchema = z.enum([
  'REQUIRES_PAYMENT',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// ---- Auth -----------------------------------------------------------------------------------

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80),
  role: z.enum(['CUSTOMER', 'MANAGER']).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// ---- Domain resources -----------------------------------------------------------------------

export interface Hotel {
  id: string;
  name: string;
  city: string;
  address: string;
  stars: number;
  status: HotelStatus;
  managerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  capacity: number;
  basePricePerNight: string | number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomTypeAvailability extends RoomType {
  totalRooms: number;
  availableRooms: number;
}

export interface Room {
  id: string;
  roomTypeId: string;
  roomNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  status: BookingStatus;
  totalPrice: string | number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  provider: string;
  providerPaymentId: string;
  amount: string | number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BookingWithPayment extends Booking {
  payment: Payment | null;
}

export interface CreatedBookingResponse {
  booking: Booking;
  payment: Payment;
  clientSecret: string | null;
}

// ---- Booking input schema (shared FE + BE) --------------------------------------------------

export const CreateBookingSchema = z
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
  });
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

// ---- Pagination envelope --------------------------------------------------------------------

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---- Dashboard ------------------------------------------------------------------------------

export interface DashboardStats {
  scope: 'admin' | 'manager' | 'customer';
  totals: { hotels: number; rooms: number; bookings: number; revenue: number };
  bookingsByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; bookings: number; revenue: number }[];
  upcomingBookings: number;
}

// ---- Errors (RFC 7807) ----------------------------------------------------------------------

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance: string;
  code?: string;
  errors?: { path: (string | number)[]; message: string }[];
}
