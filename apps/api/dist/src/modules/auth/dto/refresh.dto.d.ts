import { z } from 'zod';
export declare const refreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
declare const RefreshDto_base: {
    new (): {
        refreshToken: string;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        refreshToken: string;
    };
};
export declare class RefreshDto extends RefreshDto_base {
}
export {};
