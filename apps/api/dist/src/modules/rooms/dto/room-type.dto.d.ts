import { z } from 'zod';
export declare const createRoomTypeSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    capacity: z.ZodNumber;
    basePricePerNight: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    capacity: number;
    basePricePerNight: number;
    description?: string | undefined;
}, {
    name: string;
    capacity: number;
    basePricePerNight: number;
    description?: string | undefined;
}>;
export declare const updateRoomTypeSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    capacity: z.ZodOptional<z.ZodNumber>;
    basePricePerNight: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    capacity?: number | undefined;
    basePricePerNight?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    capacity?: number | undefined;
    basePricePerNight?: number | undefined;
}>;
declare const CreateRoomTypeDto_base: {
    new (): {
        name: string;
        capacity: number;
        basePricePerNight: number;
        description?: string | undefined;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        name: string;
        capacity: number;
        basePricePerNight: number;
        description?: string | undefined;
    };
};
export declare class CreateRoomTypeDto extends CreateRoomTypeDto_base {
}
declare const UpdateRoomTypeDto_base: {
    new (): {
        name?: string | undefined;
        description?: string | undefined;
        capacity?: number | undefined;
        basePricePerNight?: number | undefined;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        name?: string | undefined;
        description?: string | undefined;
        capacity?: number | undefined;
        basePricePerNight?: number | undefined;
    };
};
export declare class UpdateRoomTypeDto extends UpdateRoomTypeDto_base {
}
export {};
