import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import type { AuthTokens } from './types';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: 'CUSTOMER' | 'MANAGER';
}

interface LoginInput {
  email: string;
  password: string;
}

interface RequestContext {
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async register(input: RegisterInput, ctx: RequestContext): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException('email already registered');

    const passwordHash = await this.password.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.role === 'MANAGER' ? Role.MANAGER : Role.CUSTOMER,
      },
      select: { id: true, email: true, role: true },
    });
    return this.refreshTokens.issueForLogin(user, ctx);
  }

  async login(input: LoginInput, ctx: RequestContext): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, role: true, passwordHash: true },
    });
    if (!user) throw new UnauthorizedException('invalid credentials');
    const ok = await this.password.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('invalid credentials');

    return this.refreshTokens.issueForLogin(
      { id: user.id, email: user.email, role: user.role },
      ctx,
    );
  }

  async refresh(refreshToken: string, ctx: RequestContext): Promise<AuthTokens> {
    return this.refreshTokens.rotate(refreshToken, ctx);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokens.revokeByToken(refreshToken);
  }

  async me(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: Role;
    createdAt: Date;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
