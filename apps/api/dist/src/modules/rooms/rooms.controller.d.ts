import type { Request } from 'express';
import { RoomsService } from './rooms.service';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from './dto/room-type.dto';
import { AvailabilityQueryDto, CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
import type { AuthUser } from '../auth/types';
export declare class RoomsController {
    private readonly rooms;
    constructor(rooms: RoomsService);
    listTypes(hotelId: string, req: Request & {
        user?: AuthUser;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        hotelId: string;
        description: string | null;
        capacity: number;
        basePricePerNight: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    createType(hotelId: string, dto: InstanceType<typeof CreateRoomTypeDto>, actor: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        hotelId: string;
        description: string | null;
        capacity: number;
        basePricePerNight: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateType(hotelId: string, typeId: string, dto: InstanceType<typeof UpdateRoomTypeDto>, actor: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        hotelId: string;
        description: string | null;
        capacity: number;
        basePricePerNight: import("@prisma/client/runtime/library").Decimal;
    }>;
    listRooms(hotelId: string, req: Request & {
        user?: AuthUser;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        roomTypeId: string;
        roomNumber: string;
    }[]>;
    createRoom(hotelId: string, dto: InstanceType<typeof CreateRoomDto>, actor: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        roomTypeId: string;
        roomNumber: string;
    }>;
    updateRoom(hotelId: string, roomId: string, dto: InstanceType<typeof UpdateRoomDto>, actor: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        roomTypeId: string;
        roomNumber: string;
    }>;
    availability(hotelId: string, query: InstanceType<typeof AvailabilityQueryDto>, req: Request & {
        user?: AuthUser;
    }): Promise<import("./rooms.service").RoomTypeAvailability[]>;
}
