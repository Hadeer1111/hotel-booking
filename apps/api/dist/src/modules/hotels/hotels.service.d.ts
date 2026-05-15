import type { Hotel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { type Paginated } from '../../common/pagination/pagination';
import type { AuthUser } from '../auth/types';
import type { CreateHotelDto, ListHotelsDto, UpdateHotelDto } from './dto/hotel.dto';
export declare class HotelsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    /** Guest catalogue defaults to ACTIVE; staff may widen via `query.includeInactive`. */
    list(query: InstanceType<typeof ListHotelsDto>, viewer?: AuthUser): Promise<Paginated<Hotel & {
        minNightlyPrice: number | null;
    }>>;
    /** INACTIVE venues are omitted for guests/customers unless viewer is ADMIN/MANAGER. */
    findOne(id: string, viewer?: AuthUser): Promise<Hotel>;
    /**
     * Shared guard for nested hotel reads (availability, inventory) so inactive
     * listings cannot be scraped anonymously.
     */
    assertHotelVisibleToAudience(hotelId: string, viewer?: AuthUser): Promise<void>;
    private static throwIfHotelHiddenFromAudience;
    create(dto: InstanceType<typeof CreateHotelDto>): Promise<Hotel>;
    update(id: string, dto: InstanceType<typeof UpdateHotelDto>, actor: AuthUser): Promise<Hotel>;
    remove(id: string): Promise<void>;
    /**
     * ADMIN can mutate any hotel.
     * MANAGER can only mutate hotels they own.
     * All other roles -> Forbidden.
     */
    assertCanMutate(hotelId: string, actor: AuthUser): Promise<void>;
}
