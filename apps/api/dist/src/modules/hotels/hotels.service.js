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
var HotelsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_1 = require("../../common/pagination/pagination");
let HotelsService = HotelsService_1 = class HotelsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /** Guest catalogue defaults to ACTIVE; staff may widen via `query.includeInactive`. */
    async list(query, viewer) {
        const where = {};
        if (query.q)
            where.name = { contains: query.q, mode: 'insensitive' };
        if (query.city)
            where.city = { equals: query.city, mode: 'insensitive' };
        const staff = viewer && (viewer.role === client_1.Role.ADMIN || viewer.role === client_1.Role.MANAGER);
        if (query.status) {
            where.status = query.status;
        }
        else if (query.includeInactive && staff) {
            // All lifecycle states for `/manage/hotels` catalogue.
        }
        else {
            where.status = client_1.HotelStatus.ACTIVE;
        }
        if (query.stars && query.stars.length > 0)
            where.stars = { in: query.stars };
        const { skip, take } = (0, pagination_1.toSkipTake)(query);
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
        const minByHotel = new Map();
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
        return (0, pagination_1.toPaginated)(enriched, total, query);
    }
    /** INACTIVE venues are omitted for guests/customers unless viewer is ADMIN/MANAGER. */
    async findOne(id, viewer) {
        const hotel = await this.prisma.hotel.findUnique({ where: { id } });
        if (!hotel)
            throw new common_1.NotFoundException(`hotel ${id} not found`);
        HotelsService_1.throwIfHotelHiddenFromAudience(hotel, viewer);
        return hotel;
    }
    /**
     * Shared guard for nested hotel reads (availability, inventory) so inactive
     * listings cannot be scraped anonymously.
     */
    async assertHotelVisibleToAudience(hotelId, viewer) {
        const hotel = await this.prisma.hotel.findUnique({
            where: { id: hotelId },
            select: { id: true, status: true },
        });
        if (!hotel)
            throw new common_1.NotFoundException(`hotel ${hotelId} not found`);
        HotelsService_1.throwIfHotelHiddenFromAudience(hotel, viewer);
    }
    static throwIfHotelHiddenFromAudience(hotel, viewer) {
        if (hotel.status === client_1.HotelStatus.ACTIVE)
            return;
        const staff = viewer && (viewer.role === client_1.Role.ADMIN || viewer.role === client_1.Role.MANAGER);
        if (!staff) {
            throw new common_1.NotFoundException(`hotel ${hotel.id} not found`);
        }
    }
    create(dto) {
        return this.prisma.hotel.create({ data: dto });
    }
    async update(id, dto, actor) {
        await this.assertCanMutate(id, actor);
        return this.prisma.hotel.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const exists = await this.prisma.hotel.findUnique({ where: { id }, select: { id: true } });
        if (!exists)
            throw new common_1.NotFoundException(`hotel ${id} not found`);
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
    async assertCanMutate(hotelId, actor) {
        if (actor.role === client_1.Role.ADMIN)
            return;
        if (actor.role !== client_1.Role.MANAGER)
            throw new common_1.ForbiddenException('not allowed');
        const hotel = await this.prisma.hotel.findUnique({
            where: { id: hotelId },
            select: { managerId: true },
        });
        if (!hotel)
            throw new common_1.NotFoundException(`hotel ${hotelId} not found`);
        if (hotel.managerId !== actor.sub) {
            throw new common_1.ForbiddenException('you do not manage this hotel');
        }
    }
};
exports.HotelsService = HotelsService;
exports.HotelsService = HotelsService = HotelsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HotelsService);
//# sourceMappingURL=hotels.service.js.map