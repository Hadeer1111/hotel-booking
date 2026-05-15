import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import type { AuthTokens, AuthUser } from './types';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(dto: InstanceType<typeof RegisterDto>, req: Request): Promise<AuthTokens>;
    login(dto: InstanceType<typeof LoginDto>, req: Request): Promise<AuthTokens>;
    refresh(dto: InstanceType<typeof RefreshDto>, req: Request): Promise<AuthTokens>;
    logout(dto: InstanceType<typeof RefreshDto>): Promise<void>;
    me(user: AuthUser): Promise<unknown>;
}
