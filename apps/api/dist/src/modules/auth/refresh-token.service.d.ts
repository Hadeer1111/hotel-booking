import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import type { AuthTokens } from './types';
interface TokenContext {
    userAgent?: string;
    ip?: string;
}
/**
 * Implements OAuth 2.0 refresh-token rotation with reuse detection.
 *
 * - On login: opens a new family, issues access + refresh tokens
 * - On refresh: rotates the refresh token within the same family
 * - On reuse (already-revoked token presented again): the entire family is
 *   revoked and the caller is forced to re-authenticate. See README §
 *   "Refresh-token rotation with reuse detection".
 */
export declare class RefreshTokenService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, config: AppConfigService);
    issueForLogin(user: {
        id: string;
        email: string;
        role: 'ADMIN' | 'MANAGER' | 'CUSTOMER';
    }, ctx?: TokenContext): Promise<AuthTokens>;
    rotate(presentedToken: string, ctx?: TokenContext): Promise<AuthTokens>;
    revokeByToken(presentedToken: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
    private mint;
    private mintInTx;
}
export {};
