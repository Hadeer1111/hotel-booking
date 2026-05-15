import { z } from 'zod';
export declare const createHotelSchema: z.ZodObject<{
    name: z.ZodString;
    city: z.ZodString;
    address: z.ZodString;
    stars: z.ZodNumber;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "INACTIVE"]>>;
    managerId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "ACTIVE" | "INACTIVE";
    name: string;
    city: string;
    address: string;
    stars: number;
    managerId?: string | undefined;
}, {
    name: string;
    city: string;
    address: string;
    stars: number;
    status?: "ACTIVE" | "INACTIVE" | undefined;
    managerId?: string | undefined;
}>;
export declare const updateHotelSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    stars: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["ACTIVE", "INACTIVE"]>>>;
} & {
    managerId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
}, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "INACTIVE" | undefined;
    name?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    stars?: number | undefined;
    managerId?: string | null | undefined;
}, {
    status?: "ACTIVE" | "INACTIVE" | undefined;
    name?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    stars?: number | undefined;
    managerId?: string | null | undefined;
}>;
export declare const listHotelsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
} & {
    q: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE"]>>;
    stars: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, number[] | undefined, string | string[] | undefined>;
    /**
     * When true, staff (ADMIN/MANAGER) lists ACTIVE and INACTIVE rows. Ignored for
     * other callers — they always see ACTIVE-only unless `status` narrows further.
     */
    includeInactive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    includeInactive: boolean;
    status?: "ACTIVE" | "INACTIVE" | undefined;
    city?: string | undefined;
    stars?: number[] | undefined;
    q?: string | undefined;
}, {
    status?: "ACTIVE" | "INACTIVE" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    city?: string | undefined;
    stars?: string | string[] | undefined;
    q?: string | undefined;
    includeInactive?: boolean | undefined;
}>;
declare const CreateHotelDto_base: {
    new (): {
        status: "ACTIVE" | "INACTIVE";
        name: string;
        city: string;
        address: string;
        stars: number;
        managerId?: string | undefined;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        status: "ACTIVE" | "INACTIVE";
        name: string;
        city: string;
        address: string;
        stars: number;
        managerId?: string | undefined;
    };
};
export declare class CreateHotelDto extends CreateHotelDto_base {
}
declare const UpdateHotelDto_base: {
    new (): {
        status?: "ACTIVE" | "INACTIVE" | undefined;
        name?: string | undefined;
        city?: string | undefined;
        address?: string | undefined;
        stars?: number | undefined;
        managerId?: string | null | undefined;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        status?: "ACTIVE" | "INACTIVE" | undefined;
        name?: string | undefined;
        city?: string | undefined;
        address?: string | undefined;
        stars?: number | undefined;
        managerId?: string | null | undefined;
    };
};
export declare class UpdateHotelDto extends UpdateHotelDto_base {
}
declare const ListHotelsDto_base: {
    new (): {
        page: number;
        limit: number;
        includeInactive: boolean;
        status?: "ACTIVE" | "INACTIVE" | undefined;
        city?: string | undefined;
        stars?: number[] | undefined;
        q?: string | undefined;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        page: number;
        limit: number;
        includeInactive: boolean;
        status?: "ACTIVE" | "INACTIVE" | undefined;
        city?: string | undefined;
        stars?: number[] | undefined;
        q?: string | undefined;
    };
};
export declare class ListHotelsDto extends ListHotelsDto_base {
}
export {};
