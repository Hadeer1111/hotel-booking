import { z } from 'zod';
export declare const createBookingSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    hotelId: z.ZodString;
    roomTypeId: z.ZodString;
    checkIn: z.ZodDate;
    checkOut: z.ZodDate;
    guestCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    guestCount: number;
}, {
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    guestCount: number;
}>, {
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    guestCount: number;
}, {
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    guestCount: number;
}>, {
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    guestCount: number;
}, {
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    guestCount: number;
}>;
export declare const listBookingsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
} & {
    status: z.ZodOptional<z.ZodEnum<["PENDING", "CONFIRMED", "CANCELLED"]>>;
    hotelId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "PENDING" | "CONFIRMED" | "CANCELLED" | undefined;
    hotelId?: string | undefined;
}, {
    status?: "PENDING" | "CONFIRMED" | "CANCELLED" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    hotelId?: string | undefined;
}>;
export declare const updateBookingStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["CONFIRMED", "CANCELLED"]>;
}, "strip", z.ZodTypeAny, {
    status: "CONFIRMED" | "CANCELLED";
}, {
    status: "CONFIRMED" | "CANCELLED";
}>;
declare const CreateBookingDto_base: {
    new (): {
        hotelId: string;
        roomTypeId: string;
        checkIn: Date;
        checkOut: Date;
        guestCount: number;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        hotelId: string;
        roomTypeId: string;
        checkIn: Date;
        checkOut: Date;
        guestCount: number;
    };
};
export declare class CreateBookingDto extends CreateBookingDto_base {
}
declare const ListBookingsDto_base: {
    new (): {
        page: number;
        limit: number;
        status?: "PENDING" | "CONFIRMED" | "CANCELLED" | undefined;
        hotelId?: string | undefined;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        page: number;
        limit: number;
        status?: "PENDING" | "CONFIRMED" | "CANCELLED" | undefined;
        hotelId?: string | undefined;
    };
};
export declare class ListBookingsDto extends ListBookingsDto_base {
}
declare const UpdateBookingStatusDto_base: {
    new (): {
        status: "CONFIRMED" | "CANCELLED";
    };
    schema: z.ZodType;
    parse(input: unknown): {
        status: "CONFIRMED" | "CANCELLED";
    };
};
export declare class UpdateBookingStatusDto extends UpdateBookingStatusDto_base {
}
export {};
