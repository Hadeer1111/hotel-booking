import { Injectable, NotFoundException } from '@nestjs/common';
import type { Room, RoomType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HotelsService } from '../hotels/hotels.service';
import type { AuthUser } from '../auth/types';
import type {
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
} from './dto/room-type.dto';
import type { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';

export interface RoomTypeAvailability extends RoomType {
  totalRooms: number;
  availableRooms: number;
}

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hotels: HotelsService,
  ) {}

  // ---- RoomType CRUD ----------------------------------------------------------------------

  async listTypes(hotelId: string, viewer?: AuthUser): Promise<RoomType[]> {
    await this.hotels.assertHotelVisibleToAudience(hotelId, viewer);
    return this.prisma.roomType.findMany({
      where: { hotelId },
      orderBy: { basePricePerNight: 'asc' },
    });
  }

  async createType(
    hotelId: string,
    dto: InstanceType<typeof CreateRoomTypeDto>,
    actor: AuthUser,
  ): Promise<RoomType> {
    await this.hotels.assertCanMutate(hotelId, actor);
    return this.prisma.roomType.create({ data: { hotelId, ...dto } });
  }

  async updateType(
    hotelId: string,
    typeId: string,
    dto: InstanceType<typeof UpdateRoomTypeDto>,
    actor: AuthUser,
  ): Promise<RoomType> {
    await this.hotels.assertCanMutate(hotelId, actor);
    const type = await this.prisma.roomType.findFirst({
      where: { id: typeId, hotelId },
      select: { id: true },
    });
    if (!type) throw new NotFoundException(`room type ${typeId} not found in hotel ${hotelId}`);
    return this.prisma.roomType.update({ where: { id: typeId }, data: dto });
  }

  // ---- Room CRUD --------------------------------------------------------------------------

  async listRooms(hotelId: string, viewer?: AuthUser): Promise<Room[]> {
    await this.hotels.assertHotelVisibleToAudience(hotelId, viewer);
    return this.prisma.room.findMany({
      where: { roomType: { hotelId } },
      orderBy: [{ roomType: { basePricePerNight: 'asc' } }, { roomNumber: 'asc' }],
    });
  }

  async createRoom(
    hotelId: string,
    dto: InstanceType<typeof CreateRoomDto>,
    actor: AuthUser,
  ): Promise<Room> {
    await this.hotels.assertCanMutate(hotelId, actor);
    const type = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, hotelId },
      select: { id: true },
    });
    if (!type) throw new NotFoundException(`room type ${dto.roomTypeId} not in hotel ${hotelId}`);
    return this.prisma.room.create({ data: dto });
  }

  async updateRoom(
    hotelId: string,
    roomId: string,
    dto: InstanceType<typeof UpdateRoomDto>,
    actor: AuthUser,
  ): Promise<Room> {
    await this.hotels.assertCanMutate(hotelId, actor);
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, roomType: { hotelId } },
      select: { id: true },
    });
    if (!room) throw new NotFoundException(`room ${roomId} not in hotel ${hotelId}`);
    return this.prisma.room.update({ where: { id: roomId }, data: dto });
  }

  /**
   * Task-style `PATCH /rooms/:roomId` — resolves hotel from the physical room row.
   */
  async updateRoomByRoomId(
    roomId: string,
    dto: InstanceType<typeof UpdateRoomDto>,
    actor: AuthUser,
  ): Promise<Room> {
    const found = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { roomType: { select: { hotelId: true } } },
    });
    if (!found) throw new NotFoundException(`room ${roomId} not found`);
    return this.updateRoom(found.roomType.hotelId, roomId, dto, actor);
  }

  /**
   * Task-style `POST /rooms` with `hotelId` in the JSON body.
   */
  async createRoomFromFlatBody(
    dto: { hotelId: string; roomTypeId: string; roomNumber: string },
    actor: AuthUser,
  ): Promise<Room> {
    const { hotelId, roomTypeId, roomNumber } = dto;
    return this.createRoom(hotelId, { roomTypeId, roomNumber }, actor);
  }

  // ---- Date-aware availability ------------------------------------------------------------

  /**
   * Per-RoomType availability for the requested date range.
   * Available = totalRooms - count(distinct rooms with overlapping PENDING/CONFIRMED bookings).
   *
   * Runs as a single round-trip via groupBy + a raw overlap query so it scales with the
   * number of room types per hotel rather than the number of bookings.
   */
  async availability(
    hotelId: string,
    checkIn: Date,
    checkOut: Date,
    viewer?: AuthUser,
  ): Promise<RoomTypeAvailability[]> {
    await this.hotels.assertHotelVisibleToAudience(hotelId, viewer);
    const types = await this.prisma.roomType.findMany({
      where: { hotelId },
      include: { _count: { select: { rooms: true } } },
      orderBy: { basePricePerNight: 'asc' },
    });
    if (types.length === 0) return [];

    const overlapping = await this.prisma.$queryRaw<{ roomTypeId: string; busy: bigint }[]>`
      SELECT r."roomTypeId" AS "roomTypeId", COUNT(DISTINCT r.id) AS "busy"
      FROM "Booking" b
      JOIN "Room" r ON r.id = b."roomId"
      JOIN "RoomType" rt ON rt.id = r."roomTypeId"
      WHERE rt."hotelId" = ${hotelId}
        AND b.status IN ('PENDING','CONFIRMED')
        AND tstzrange(b."checkIn", b."checkOut", '[)') &&
            tstzrange(${checkIn}::timestamptz, ${checkOut}::timestamptz, '[)')
      GROUP BY r."roomTypeId"
    `;
    const busyByType = new Map(overlapping.map((row) => [row.roomTypeId, Number(row.busy)]));

    return types.map(({ _count, ...rt }) => {
      const total = _count.rooms;
      const busy = busyByType.get(rt.id) ?? 0;
      return { ...rt, totalRooms: total, availableRooms: Math.max(0, total - busy) };
    });
  }
}
