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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const rooms_service_1 = require("./rooms.service");
const zod_validation_pipe_1 = require("../../common/zod/zod-validation.pipe");
const room_type_dto_1 = require("./dto/room-type.dto");
const room_dto_1 = require("./dto/room.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../auth/guards/optional-jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let RoomsController = class RoomsController {
    constructor(rooms) {
        this.rooms = rooms;
    }
    // ---- Room types ----------------------------------------------------------
    listTypes(hotelId, req) {
        return this.rooms.listTypes(hotelId, req.user);
    }
    createType(hotelId, dto, actor) {
        return this.rooms.createType(hotelId, dto, actor);
    }
    updateType(hotelId, typeId, dto, actor) {
        return this.rooms.updateType(hotelId, typeId, dto, actor);
    }
    // ---- Physical rooms -------------------------------------------------------
    listRooms(hotelId, req) {
        return this.rooms.listRooms(hotelId, req.user);
    }
    createRoom(hotelId, dto, actor) {
        return this.rooms.createRoom(hotelId, dto, actor);
    }
    updateRoom(hotelId, roomId, dto, actor) {
        return this.rooms.updateRoom(hotelId, roomId, dto, actor);
    }
    // ---- Availability --------------------------------------------------------
    availability(hotelId, query, req) {
        return this.rooms.availability(hotelId, query.checkIn, query.checkOut, req.user);
    }
};
exports.RoomsController = RoomsController;
__decorate([
    (0, common_1.Get)('room-types'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('hotelId', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "listTypes", null);
__decorate([
    (0, common_1.Post)('room-types'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.MANAGER),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Param)('hotelId', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(room_type_dto_1.CreateRoomTypeDto))),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, void 0, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "createType", null);
__decorate([
    (0, common_1.Patch)('room-types/:typeId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.MANAGER),
    __param(0, (0, common_1.Param)('hotelId', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Param)('typeId', new common_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(room_type_dto_1.UpdateRoomTypeDto))),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, void 0, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "updateType", null);
__decorate([
    (0, common_1.Get)('rooms'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('hotelId', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "listRooms", null);
__decorate([
    (0, common_1.Post)('rooms'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.MANAGER),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Param)('hotelId', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(room_dto_1.CreateRoomDto))),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, void 0, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Patch)('rooms/:roomId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.MANAGER),
    __param(0, (0, common_1.Param)('hotelId', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Param)('roomId', new common_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(room_dto_1.UpdateRoomDto))),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, void 0, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "updateRoom", null);
__decorate([
    (0, common_1.Get)('availability'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('hotelId', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(room_dto_1.AvailabilityQueryDto))),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, void 0, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "availability", null);
exports.RoomsController = RoomsController = __decorate([
    (0, common_1.Controller)({ path: 'hotels/:hotelId', version: '1' }),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService])
], RoomsController);
//# sourceMappingURL=rooms.controller.js.map