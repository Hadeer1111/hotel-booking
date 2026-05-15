import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["CUSTOMER", "MANAGER"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
    role?: "MANAGER" | "CUSTOMER" | undefined;
}, {
    email: string;
    name: string;
    password: string;
    role?: "MANAGER" | "CUSTOMER" | undefined;
}>;
declare const RegisterDto_base: {
    new (): {
        email: string;
        name: string;
        password: string;
        role?: "MANAGER" | "CUSTOMER" | undefined;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        email: string;
        name: string;
        password: string;
        role?: "MANAGER" | "CUSTOMER" | undefined;
    };
};
export declare class RegisterDto extends RegisterDto_base {
}
export {};
