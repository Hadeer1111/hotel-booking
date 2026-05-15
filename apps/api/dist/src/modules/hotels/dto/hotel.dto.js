"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListHotelsDto = exports.UpdateHotelDto = exports.CreateHotelDto = exports.listHotelsSchema = exports.updateHotelSchema = exports.createHotelSchema = void 0;
const zod_1 = require("zod");
const create_zod_dto_1 = require("../../../common/zod/create-zod-dto");
const pagination_1 = require("../../../common/pagination/pagination");
exports.createHotelSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    city: zod_1.z.string().min(1).max(80),
    address: zod_1.z.string().min(1).max(255),
    stars: zod_1.z.coerce.number().int().min(1).max(5),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
    managerId: zod_1.z.string().uuid().optional(),
});
exports.updateHotelSchema = exports.createHotelSchema
    .partial()
    .extend({
    /** `null` explicitly clears the assigning manager so the hotel becomes unstaffed again. */
    managerId: zod_1.z.union([zod_1.z.string().uuid(), zod_1.z.null()]).optional(),
});
exports.listHotelsSchema = pagination_1.paginationSchema.extend({
    q: zod_1.z.string().trim().min(1).max(120).optional(),
    city: zod_1.z.string().trim().min(1).max(80).optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
    // Accepts either `stars=4&stars=5` (array) or `stars=4,5` (CSV).
    // Coerces to a deduped sorted list of ints in [1, 5]; `undefined` if empty/invalid.
    stars: zod_1.z
        .union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())])
        .optional()
        .transform((v) => {
        if (v === undefined)
            return undefined;
        const raw = Array.isArray(v) ? v : v.split(',');
        const ints = raw
            .map((s) => Number.parseInt(String(s).trim(), 10))
            .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
        return ints.length ? Array.from(new Set(ints)).sort((a, b) => a - b) : undefined;
    }),
    /**
     * When true, staff (ADMIN/MANAGER) lists ACTIVE and INACTIVE rows. Ignored for
     * other callers — they always see ACTIVE-only unless `status` narrows further.
     */
    includeInactive: zod_1.z.coerce.boolean().optional().default(false),
});
class CreateHotelDto extends (0, create_zod_dto_1.createZodDto)(exports.createHotelSchema) {
}
exports.CreateHotelDto = CreateHotelDto;
class UpdateHotelDto extends (0, create_zod_dto_1.createZodDto)(exports.updateHotelSchema) {
}
exports.UpdateHotelDto = UpdateHotelDto;
class ListHotelsDto extends (0, create_zod_dto_1.createZodDto)(exports.listHotelsSchema) {
}
exports.ListHotelsDto = ListHotelsDto;
//# sourceMappingURL=hotel.dto.js.map