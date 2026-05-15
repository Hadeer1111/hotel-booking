import type { Room, RoomType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HotelsService } from '../hotels/hotels.service';
import type { AuthUser } from '../auth/types';
import type { CreateRoomTypeDto, UpdateRoomTypeDto } from './dto/room-type.dto';
import type { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
export interface RoomTypeAvailability extends RoomType {
    totalRooms: number;
    availableRooms: number;
}
export declare class RoomsService {
    private readonly prisma;
    private readonly hotels;
    constructor(prisma: PrismaService, hotels: HotelsService);
    listTypes(hotelId: string, viewer?: AuthUser): Promise<RoomType[]>;
    createType(hotelId: string, dto: InstanceType<typeof CreateRoomTypeDto>, actor: AuthUser): Promise<RoomType>;
    updateType(hotelId: string, typeId: string, dto: InstanceType<typeof UpdateRoomTypeDto>, actor: AuthUser): Promise<RoomType>;
    listRooms(hotelId: string, viewer?: AuthUser): Promise<Room[]>;
    createRoom(hotelId: string, dto: InstanceType<typeof CreateRoomDto>, actor: AuthUser): Promise<Room>;
    updateRoom(hotelId: string, roomId: string, dto: InstanceType<typeof UpdateRoomDto>, actor: AuthUser): Promise<Room>;
    /**
     * Task-style `PATCH /rooms/:roomId` — resolves hotel from the physical room row.
     */
    updateRoomByRoomId(roomId: string, dto: InstanceType<typeof UpdateRoomDto>, actor: AuthUser): Promise<Room>;
    /**
     * Task-style `POST /rooms` with `hotelId` in the JSON body.
     */
    createRoomFromFlatBody(dto: {
        hotelId: string;
        roomTypeId: string;
        roomNumber: string;
    }, actor: AuthUser): Promise<Room>;
    /**
     * Per-RoomType availability for the requested date range.
     * Available = totalRooms - count(distinct rooms with overlapping PENDING/CONFIRMED bookings).
     *
     * Runs as a single round-trip via groupBy + a raw overlap query so it scales with the
     * number of room types per hotel rather than the number of bookings.
     */
    availability(hotelId: string, checkIn: Date, checkOut: Date, viewer?: AuthUser): Promise<RoomTypeAvailability[]>;
}
