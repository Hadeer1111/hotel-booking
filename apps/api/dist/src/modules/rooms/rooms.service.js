"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const hotels_service_1 = require("../hotels/hotels.service");
let RoomsService = class RoomsService {
    constructor(prisma, hotels) {
        this.prisma = prisma;
        this.hotels = hotels;
    }
    // ---- RoomType CRUD ----------------------------------------------------------------------
    async listTypes(hotelId, viewer) {
        await this.hotels.assertHotelVisibleToAudience(hotelId, viewer);
        return this.prisma.roomType.findMany({
            where: { hotelId },
            orderBy: { basePricePerNight: 'asc' },
        });
    }
    async createType(hotelId, dto, actor) {
        await this.hotels.assertCanMutate(hotelId, actor);
        return this.prisma.roomType.create({ data: { hotelId, ...dto } });
    }
    async updateType(hotelId, typeId, dto, actor) {
        await this.hotels.assertCanMutate(hotelId, actor);
        const type = await this.prisma.roomType.findFirst({
            where: { id: typeId, hotelId },
            select: { id: true },
        });
        if (!type)
            throw new common_1.NotFoundException(`room type ${typeId} not found in hotel ${hotelId}`);
        return this.prisma.roomType.update({ where: { id: typeId }, data: dto });
    }
    // ---- Room CRUD --------------------------------------------------------------------------
    async listRooms(hotelId, viewer) {
        await this.hotels.assertHotelVisibleToAudience(hotelId, viewer);
        return this.prisma.room.findMany({
            where: { roomType: { hotelId } },
            orderBy: [{ roomType: { basePricePerNight: 'asc' } }, { roomNumber: 'asc' }],
        });
    }
    async createRoom(hotelId, dto, actor) {
        await this.hotels.assertCanMutate(hotelId, actor);
        const type = await this.prisma.roomType.findFirst({
            where: { id: dto.roomTypeId, hotelId },
            select: { id: true },
        });
        if (!type)
            throw new common_1.NotFoundException(`room type ${dto.roomTypeId} not in hotel ${hotelId}`);
        return this.prisma.room.create({ data: dto });
    }
    async updateRoom(hotelId, roomId, dto, actor) {
        await this.hotels.assertCanMutate(hotelId, actor);
        const room = await this.prisma.room.findFirst({
            where: { id: roomId, roomType: { hotelId } },
            select: { id: true },
        });
        if (!room)
            throw new common_1.NotFoundException(`room ${roomId} not in hotel ${hotelId}`);
        return this.prisma.room.update({ where: { id: roomId }, data: dto });
    }
    /**
     * Task-style `PATCH /rooms/:roomId` — resolves hotel from the physical room row.
     */
    async updateRoomByRoomId(roomId, dto, actor) {
        const found = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: { roomType: { select: { hotelId: true } } },
        });
        if (!found)
            throw new common_1.NotFoundException(`room ${roomId} not found`);
        return this.updateRoom(found.roomType.hotelId, roomId, dto, actor);
    }
    /**
     * Task-style `POST /rooms` with `hotelId` in the JSON body.
     */
    async createRoomFromFlatBody(dto, actor) {
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
    async availability(hotelId, checkIn, checkOut, viewer) {
        await this.hotels.assertHotelVisibleToAudience(hotelId, viewer);
        const types = await this.prisma.roomType.findMany({
            where: { hotelId },
            include: { _count: { select: { rooms: true } } },
            orderBy: { basePricePerNight: 'asc' },
        });
        if (types.length === 0)
            return [];
        const overlapping = await this.prisma.$queryRaw `
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
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        hotels_service_1.HotelsService])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map