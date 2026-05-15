import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
declare const LoginDto_base: {
    new (): {
        email: string;
        password: string;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        email: string;
        password: string;
    };
};
export declare class LoginDto extends LoginDto_base {
}
export {};
