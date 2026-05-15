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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const password_service_1 = require("./password.service");
const refresh_token_service_1 = require("./refresh-token.service");
let AuthService = class AuthService {
    constructor(prisma, password, refreshTokens) {
        this.prisma = prisma;
        this.password = password;
        this.refreshTokens = refreshTokens;
    }
    async register(input, ctx) {
        const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
        if (existing)
            throw new common_1.ConflictException('email already registered');
        const passwordHash = await this.password.hash(input.password);
        const user = await this.prisma.user.create({
            data: {
                email: input.email,
                name: input.name,
                passwordHash,
                role: input.role === 'MANAGER' ? client_1.Role.MANAGER : client_1.Role.CUSTOMER,
            },
            select: { id: true, email: true, role: true },
        });
        return this.refreshTokens.issueForLogin(user, ctx);
    }
    async login(input, ctx) {
        const user = await this.prisma.user.findUnique({
            where: { email: input.email },
            select: { id: true, email: true, role: true, passwordHash: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException('invalid credentials');
        const ok = await this.password.compare(input.password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('invalid credentials');
        return this.refreshTokens.issueForLogin({ id: user.id, email: user.email, role: user.role }, ctx);
    }
    async refresh(refreshToken, ctx) {
        return this.refreshTokens.rotate(refreshToken, ctx);
    }
    async logout(refreshToken) {
        await this.refreshTokens.revokeByToken(refreshToken);
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        password_service_1.PasswordService,
        refresh_token_service_1.RefreshTokenService])
], AuthService);
//# sourceMappingURL=auth.service.js.map