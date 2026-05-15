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
export declare class AuthService {
    private readonly prisma;
    private readonly password;
    private readonly refreshTokens;
    constructor(prisma: PrismaService, password: PasswordService, refreshTokens: RefreshTokenService);
    register(input: RegisterInput, ctx: RequestContext): Promise<AuthTokens>;
    login(input: LoginInput, ctx: RequestContext): Promise<AuthTokens>;
    refresh(refreshToken: string, ctx: RequestContext): Promise<AuthTokens>;
    logout(refreshToken: string): Promise<void>;
    me(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: Role;
        createdAt: Date;
    }>;
}
export {};
