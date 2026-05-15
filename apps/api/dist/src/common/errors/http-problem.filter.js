"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpProblemFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpProblemFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
let HttpProblemFilter = HttpProblemFilter_1 = class HttpProblemFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpProblemFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        const problem = this.toProblem(exception, req);
        if (problem.status >= 500) {
            this.logger.error(`${req.method} ${req.url} -> ${problem.status}`, exception);
        }
        res
            .status(problem.status)
            .type('application/problem+json')
            .json(problem);
    }
    toProblem(exception, req) {
        const instance = req.originalUrl ?? req.url ?? '';
        if (exception instanceof zod_1.ZodError) {
            return {
                type: 'https://hotel-booking.dev/errors/validation',
                title: 'Validation Failed',
                status: common_1.HttpStatus.BAD_REQUEST,
                detail: 'one or more fields are invalid',
                code: 'VALIDATION_ERROR',
                instance,
                errors: exception.issues.map((i) => ({ path: i.path, message: i.message })),
            };
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const resBody = exception.getResponse();
            const detail = typeof resBody === 'string' ? resBody : resBody.message;
            const code = typeof resBody === 'object' ? resBody.code : undefined;
            return {
                type: `https://hotel-booking.dev/errors/${status}`,
                title: exception.message,
                status,
                detail: typeof detail === 'string' ? detail : exception.message,
                code,
                instance,
            };
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            const mapped = mapPrismaError(exception);
            return { ...mapped, instance };
        }
        return {
            type: 'about:blank',
            title: 'Internal Server Error',
            status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            detail: 'An unexpected error occurred',
            instance,
        };
    }
};
exports.HttpProblemFilter = HttpProblemFilter;
exports.HttpProblemFilter = HttpProblemFilter = HttpProblemFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpProblemFilter);
function mapPrismaError(err) {
    switch (err.code) {
        case 'P2002': // unique violation
            return {
                type: 'https://hotel-booking.dev/errors/conflict',
                title: 'Conflict',
                status: common_1.HttpStatus.CONFLICT,
                detail: 'a resource with the given unique value already exists',
                code: 'UNIQUE_VIOLATION',
            };
        case 'P2025': // record not found
            return {
                type: 'https://hotel-booking.dev/errors/not-found',
                title: 'Not Found',
                status: common_1.HttpStatus.NOT_FOUND,
                detail: 'resource not found',
                code: 'NOT_FOUND',
            };
        default:
            return {
                type: 'about:blank',
                title: 'Database Error',
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                detail: err.message,
                code: err.code,
            };
    }
}
//# sourceMappingURL=http-problem.filter.js.map