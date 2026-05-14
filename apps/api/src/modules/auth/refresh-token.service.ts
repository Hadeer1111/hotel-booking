import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import type { AuthTokens } from './types';

const REFRESH_BYTES = 64;

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
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async issueForLogin(
    user: { id: string; email: string; role: 'ADMIN' | 'MANAGER' | 'CUSTOMER' },
    ctx: TokenContext = {},
  ): Promise<AuthTokens> {
    const familyId = randomUUID();
    return this.mint(user, familyId, ctx);
  }

  async rotate(presentedToken: string, ctx: TokenContext = {}): Promise<AuthTokens> {
    const tokenHash = hashToken(presentedToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('invalid refresh token');
    }

    if (record.revokedAt !== null) {
      this.logger.warn(
        `refresh token reuse detected for family ${record.familyId} (user ${record.userId}) — revoking entire family`,
      );
      await this.prisma.refreshToken.updateMany({
        where: { familyId: record.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('refresh token reuse detected');
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

  async revokeByToken(presentedToken: string): Promise<void> {
    const tokenHash = hashToken(presentedToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async mint(
    user: { id: string; email: string; role: 'ADMIN' | 'MANAGER' | 'CUSTOMER' },
    familyId: string,
    ctx: TokenContext,
  ): Promise<AuthTokens> {
    const { tokens } = await this.mintInTx(this.prisma, user, familyId, ctx);
    return tokens;
  }

  private async mintInTx(
    tx: PrismaService | Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    user: { id: string; email: string; role: 'ADMIN' | 'MANAGER' | 'CUSTOMER' },
    familyId: string,
    ctx: TokenContext,
  ): Promise<{ tokens: AuthTokens; id: string }> {
    const accessSecret = this.config.jwt.accessSecret;
    const accessTtl = this.config.jwt.accessTtl;
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: accessSecret, expiresIn: accessTtl },
    );
    const accessExpiresIn = parseTtlToSeconds(accessTtl);

    const refreshPlain = randomBytes(REFRESH_BYTES).toString('base64url');
    const refreshExpiresAt = new Date(
      Date.now() + parseTtlToSeconds(this.config.jwt.refreshTtl) * 1000,
    );

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
}

function hashToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

/** Lightweight TTL parser: supports plain seconds, "Ns", "Nm", "Nh", "Nd". */
function parseTtlToSeconds(ttl: string): number {
  const match = /^(\d+)\s*([smhd]?)$/i.exec(ttl);
  if (!match || !match[1]) throw new Error(`invalid TTL "${ttl}"`);
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
