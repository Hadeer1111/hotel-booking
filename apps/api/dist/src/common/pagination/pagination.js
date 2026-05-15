"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = void 0;
exports.toPaginated = toPaginated;
exports.toSkipTake = toSkipTake;
const zod_1 = require("zod");
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
function toPaginated(data, total, q) {
    return {
        data,
        meta: {
            page: q.page,
            limit: q.limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / q.limit)),
        },
    };
}
function toSkipTake(q) {
    return { skip: (q.page - 1) * q.limit, take: q.limit };
}
//# sourceMappingURL=pagination.js.map