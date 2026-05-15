import type { Request } from 'express';
import { RoomsService } from './rooms.service';
import { CreateRoomFlatDto, ListRoomsFlatQueryDto } from './dto/room-flat.dto';
import { UpdateRoomDto } from './dto/room.dto';
import type { AuthUser } from '../auth/types';
/**
 * Task-style flat REST surface (`GET/POST/PATCH /v1/rooms`).
 * Canonical hotel-scoped routes under `/v1/hotels/:hotelId/...` remain supported.
 */
export declare class RoomsResourceController {
    private readonly rooms;
    constructor(rooms: RoomsService);
    list(query: InstanceType<typeof ListRoomsFlatQueryDto>, req: Request & {
        user?: AuthUser;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        roomTypeId: string;
        roomNumber: string;
    }[]>;
    create(dto: InstanceType<typeof CreateRoomFlatDto>, actor: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        roomTypeId: string;
        roomNumber: string;
    }>;
    update(roomId: string, dto: InstanceType<typeof UpdateRoomDto>, actor: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        roomTypeId: string;
        roomNumber: string;
    }>;
}
