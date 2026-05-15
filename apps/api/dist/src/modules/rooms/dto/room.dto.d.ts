import { z } from 'zod';
export declare const createRoomSchema: z.ZodObject<{
    roomTypeId: z.ZodString;
    roomNumber: z.ZodString;
}, "strip", z.ZodTypeAny, {
    roomTypeId: string;
    roomNumber: string;
}, {
    roomTypeId: string;
    roomNumber: string;
}>;
export declare const updateRoomSchema: z.ZodObject<{
    roomTypeId: z.ZodOptional<z.ZodString>;
    roomNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    roomTypeId?: string | undefined;
    roomNumber?: string | undefined;
}, {
    roomTypeId?: string | undefined;
    roomNumber?: string | undefined;
}>;
export declare const availabilityQuerySchema: z.ZodEffects<z.ZodObject<{
    checkIn: z.ZodDate;
    checkOut: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    checkIn: Date;
    checkOut: Date;
}, {
    checkIn: Date;
    checkOut: Date;
}>, {
    checkIn: Date;
    checkOut: Date;
}, {
    checkIn: Date;
    checkOut: Date;
}>;
declare const CreateRoomDto_base: {
    new (): {
        roomTypeId: string;
        roomNumber: string;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        roomTypeId: string;
        roomNumber: string;
    };
};
export declare class CreateRoomDto extends CreateRoomDto_base {
}
declare const UpdateRoomDto_base: {
    new (): {
        roomTypeId?: string | undefined;
        roomNumber?: string | undefined;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        roomTypeId?: string | undefined;
        roomNumber?: string | undefined;
    };
};
export declare class UpdateRoomDto extends UpdateRoomDto_base {
}
declare const AvailabilityQueryDto_base: {
    new (): {
        checkIn: Date;
        checkOut: Date;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        checkIn: Date;
        checkOut: Date;
    };
};
export declare class AvailabilityQueryDto extends AvailabilityQueryDto_base {
}
export {};
