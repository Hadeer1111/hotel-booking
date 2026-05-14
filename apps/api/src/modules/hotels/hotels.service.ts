import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Hotel, Prisma } from '@prisma/client';
import { Role } from '@prisma/client';
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

  async list(query: InstanceType<typeof ListHotelsDto>): Promise<Paginated<Hotel>> {
    const where: Prisma.HotelWhereInput = {};
    if (query.q) where.name = { contains: query.q, mode: 'insensitive' };
    if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
    if (query.status) where.status = query.status;

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

    return toPaginated(data, total, query);
  }

  async findOne(id: string): Promise<Hotel> {
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });
    if (!hotel) throw new NotFoundException(`hotel ${id} not found`);
    return hotel;
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
    await this.prisma.hotel.delete({ where: { id } });
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
