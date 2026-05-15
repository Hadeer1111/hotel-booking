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
var RefreshTokenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const app_config_service_1 = require("../../config/app-config.service");
const REFRESH_BYTES = 64;
/**
 * Implements OAuth 2.0 refresh-token rotation with reuse detection.
 *
 * - On login: opens a new family, issues access + refresh tokens
 * - On refresh: rotates the refresh token within the same family
 * - On reuse (already-revoked token presented again): the entire family is
 *   revoked and the caller is forced to re-authenticate. See README §
 *   "Refresh-token rotation with reuse detection".
 */
let RefreshTokenService = RefreshTokenService_1 = class RefreshTokenService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.logger = new common_1.Logger(RefreshTokenService_1.name);
    }
    async issueForLogin(user, ctx = {}) {
        const familyId = (0, crypto_1.randomUUID)();
        return this.mint(user, familyId, ctx);
    }
    async rotate(presentedToken, ctx = {}) {
        const tokenHash = hashToken(presentedToken);
        const record = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: {
                user: { select: { id: true, email: true, role: true } },
            },
        });
        if (!record || record.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('invalid refresh token');
        }
        if (record.revokedAt !== null) {
            this.logger.warn(`refresh token reuse detected for family ${record.familyId} (user ${record.userId}) — revoking entire family`);
            await this.prisma.refreshToken.updateMany({
                where: { familyId: record.familyId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
            throw new common_1.UnauthorizedException('refresh token reuse detected');
        }
        return this.prisma.$transaction(async (tx) => {
            const next = await this.mintInTx(tx, record.user, record.familyId, ctx);
            await tx.refreshToken.update({
                where: { id: record.id },
                data: { revokedAt: new Date(), replacedById: next.id },
            });
            return next.tokens;
        });
    }
    async revokeByToken(presentedToken) {
        const tokenHash = hashToken(presentedToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async revokeAllForUser(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async mint(user, familyId, ctx) {
        const { tokens } = await this.mintInTx(this.prisma, user, familyId, ctx);
        return tokens;
    }
    async mintInTx(tx, user, familyId, ctx) {
        const accessSecret = this.config.jwt.accessSecret;
        const accessTtl = this.config.jwt.accessTtl;
        const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role }, { secret: accessSecret, expiresIn: accessTtl });
        const accessExpiresIn = parseTtlToSeconds(accessTtl);
        const refreshPlain = (0, crypto_1.randomBytes)(REFRESH_BYTES).toString('base64url');
        const refreshExpiresAt = new Date(Date.now() + parseTtlToSeconds(this.config.jwt.refreshTtl) * 1000);
        const stored = await tx.refreshToken.create({
            data: {
                userId: user.id,
                familyId,
                tokenHash: hashToken(refreshPlain),
                expiresAt: refreshExpiresAt,
                userAgent: ctx.userAgent?.slice(0, 255),
                ip: ctx.ip,
            },
        });
        return {
            id: stored.id,
            tokens: {
                accessToken,
                refreshToken: refreshPlain,
                accessTokenExpiresIn: accessExpiresIn,
            },
        };
    }
};
exports.RefreshTokenService = RefreshTokenService;
exports.RefreshTokenService = RefreshTokenService = RefreshTokenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        app_config_service_1.AppConfigService])
], RefreshTokenService);
function hashToken(plain) {
    return (0, crypto_1.createHash)('sha256').update(plain).digest('hex');
}
/** Lightweight TTL parser: supports plain seconds, "Ns", "Nm", "Nh", "Nd". */
function parseTtlToSeconds(ttl) {
    const match = /^(\d+)\s*([smhd]?)$/i.exec(ttl);
    if (!match || !match[1])
        throw new Error(`invalid TTL "${ttl}"`);
    const n = Number(match[1]);
    switch ((match[2] ?? 's').toLowerCase()) {
        case 'm':
            return n * 60;
        case 'h':
            return n * 60 * 60;
        case 'd':
            return n * 60 * 60 * 24;
        case 's':
        case '':
        default:
            return n;
    }
}
//# sourceMappingURL=refresh-token.service.js.map