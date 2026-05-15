import type { Request } from 'express';
import { HotelsService } from './hotels.service';
import { CreateHotelDto, ListHotelsDto, UpdateHotelDto } from './dto/hotel.dto';
import type { AuthUser } from '../auth/types';
export declare class HotelsController {
    private readonly hotels;
    constructor(hotels: HotelsService);
    list(query: InstanceType<typeof ListHotelsDto>, req: Request & {
        user?: AuthUser;
    }): Promise<import("../../common/pagination/pagination").Paginated<{
        status: import("@prisma/client").$Enums.HotelStatus;
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        city: string;
        address: string;
        stars: number;
        managerId: string | null;
    } & {
        minNightlyPrice: number | null;
    }>>;
    findOne(id: string, req: Request & {
        user?: AuthUser;
    }): Promise<{
        status: import("@prisma/client").$Enums.HotelStatus;
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        city: string;
        address: string;
        stars: number;
        managerId: string | null;
    }>;
    create(dto: InstanceType<typeof CreateHotelDto>): Promise<{
        status: import("@prisma/client").$Enums.HotelStatus;
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        city: string;
        address: string;
        stars: number;
        managerId: string | null;
    }>;
    update(id: string, dto: InstanceType<typeof UpdateHotelDto>, actor: AuthUser): Promise<{
        status: import("@prisma/client").$Enums.HotelStatus;
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        city: string;
        address: string;
        stars: number;
        managerId: string | null;
    }>;
    remove(id: string): Promise<void>;
}
