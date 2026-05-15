import { z } from 'zod';
/** Query for task-style `GET /v1/rooms?hotelId=…` */
export declare const listRoomsFlatQuerySchema: z.ZodObject<{
    hotelId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    hotelId: string;
}, {
    hotelId: string;
}>;
/** Body for task-style `POST /v1/rooms` (hotelId in body vs nested route). */
export declare const createRoomFlatSchema: z.ZodObject<{
    roomTypeId: z.ZodString;
    roomNumber: z.ZodString;
} & {
    hotelId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    hotelId: string;
    roomTypeId: string;
    roomNumber: string;
}, {
    hotelId: string;
    roomTypeId: string;
    roomNumber: string;
}>;
declare const ListRoomsFlatQueryDto_base: {
    new (): {
        hotelId: string;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        hotelId: string;
    };
};
export declare class ListRoomsFlatQueryDto extends ListRoomsFlatQueryDto_base {
}
declare const CreateRoomFlatDto_base: {
    new (): {
        hotelId: string;
        roomTypeId: string;
        roomNumber: string;
    };
    schema: z.ZodType;
    parse(input: unknown): {
        hotelId: string;
        roomTypeId: string;
        roomNumber: string;
    };
};
export declare class CreateRoomFlatDto extends CreateRoomFlatDto_base {
}
export {};
