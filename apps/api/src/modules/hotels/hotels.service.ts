import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Hotel, Prisma } from '@prisma/client';
import { HotelStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toPaginated, toSkipTake, type Paginated } from '../../common/pagination/pagination';
import type { AuthUser } from '../auth/types';
import type {
  CreateHotelDto,
  ListHotelsDto,
  UpdateHotelDto,
} from './dto/hotel.dto';

@Injectable()
export class HotelsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Guest catalogue defaults to ACTIVE; staff may widen via `query.includeInactive`. */
  async list(
    query: InstanceType<typeof ListHotelsDto>,
    viewer?: AuthUser,
  ): Promise<Paginated<Hotel & { minNightlyPrice: number | null }>> {
    const where: Prisma.HotelWhereInput = {};
    if (query.q) where.name = { contains: query.q, mode: 'insensitive' };
    if (query.city) where.city = { equals: query.city, mode: 'insensitive' };

    const staff =
      viewer && (viewer.role === Role.ADMIN || viewer.role === Role.MANAGER);
    if (query.status) {
      where.status = query.status;
    } else if (query.includeInactive && staff) {
      // All lifecycle states for `/manage/hotels` catalogue.
    } else {
      where.status = HotelStatus.ACTIVE;
    }

    if (query.stars && query.stars.length > 0) where.stars = { in: query.stars };

    const { skip, take } = toSkipTake(query);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.hotel.findMany({
        where,
        orderBy: [{ stars: 'desc' }, { name: 'asc' }],
        skip,
        take,
      }),
      this.prisma.hotel.count({ where }),
    ]);

    // Enrich the page with the cheapest published nightly rate per hotel so
    // the UI can render "from $X / night" without an N+1 round trip. One
    // grouped aggregation regardless of page size; bounded by `take`.
    const ids = data.map((h) => h.id);
    const minByHotel = new Map<string, number | null>();
    if (ids.length > 0) {
      const grouped = await this.prisma.roomType.groupBy({
        by: ['hotelId'],
        where: { hotelId: { in: ids } },
        _min: { basePricePerNight: true },
      });
      for (const row of grouped) {
        const raw = row._min.basePricePerNight;
        minByHotel.set(row.hotelId, raw == null ? null : Number(raw));
      }
    }
    const enriched = data.map((h) => ({
      ...h,
      minNightlyPrice: minByHotel.get(h.id) ?? null,
    }));

    return toPaginated(enriched, total, query);
  }

  /** INACTIVE venues are omitted for guests/customers unless viewer is ADMIN/MANAGER. */
  async findOne(id: string, viewer?: AuthUser): Promise<Hotel> {
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });
    if (!hotel) throw new NotFoundException(`hotel ${id} not found`);
    HotelsService.throwIfHotelHiddenFromAudience(hotel, viewer);
    return hotel;
  }

  /**
   * Shared guard for nested hotel reads (availability, inventory) so inactive
   * listings cannot be scraped anonymously.
   */
  async assertHotelVisibleToAudience(hotelId: string, viewer?: AuthUser): Promise<void> {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, status: true },
    });
    if (!hotel) throw new NotFoundException(`hotel ${hotelId} not found`);
    HotelsService.throwIfHotelHiddenFromAudience(hotel, viewer);
  }

  private static throwIfHotelHiddenFromAudience(
    hotel: { id: string; status: HotelStatus },
    viewer?: AuthUser,
  ): void {
    if (hotel.status === HotelStatus.ACTIVE) return;
    const staff =
      viewer && (viewer.role === Role.ADMIN || viewer.role === Role.MANAGER);
    if (!staff) {
      throw new NotFoundException(`hotel ${hotel.id} not found`);
    }
  }

  create(dto: InstanceType<typeof CreateHotelDto>): Promise<Hotel> {
    return this.prisma.hotel.create({ data: dto });
  }

  async update(
    id: string,
    dto: InstanceType<typeof UpdateHotelDto>,
    actor: AuthUser,
  ): Promise<Hotel> {
    await this.assertCanMutate(id, actor);
    return this.prisma.hotel.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    const exists = await this.prisma.hotel.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException(`hotel ${id} not found`);
    // `Booking` references `Room` with onDelete: Restrict — remove dependent rows first
    // so deleting a hotel with history does not fail the FK constraint.
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.deleteMany({
        where: { room: { roomType: { hotelId: id } } },
      });
      await tx.hotel.delete({ where: { id } });
    });
  }

  /**
   * ADMIN can mutate any hotel.
   * MANAGER can only mutate hotels they own.
   * All other roles -> Forbidden.
   */
  async assertCanMutate(hotelId: string, actor: AuthUser): Promise<void> {
    if (actor.role === Role.ADMIN) return;
    if (actor.role !== Role.MANAGER) throw new ForbiddenException('not allowed');
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { managerId: true },
    });
    if (!hotel) throw new NotFoundException(`hotel ${hotelId} not found`);
    if (hotel.managerId !== actor.sub) {
      throw new ForbiddenException('you do not manage this hotel');
    }
  }
}
