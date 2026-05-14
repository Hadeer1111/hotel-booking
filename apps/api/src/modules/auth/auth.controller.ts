import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/zod/zod-validation.pipe';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthTokens, AuthUser } from './types';

function ctxFromRequest(req: Request): { userAgent?: string; ip?: string } {
  return {
    userAgent: req.headers['user-agent'] ?? undefined,
    ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  };
}

// 10 requests / minute on every auth mutation: enough for real humans
// but tight enough to brick credential-stuffing/refresh-replay loops.
@Controller({ path: 'auth', version: '1' })
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(201)
  register(
    @Body(new ZodValidationPipe(RegisterDto)) dto: InstanceType<typeof RegisterDto>,
    @Req() req: Request,
  ): Promise<AuthTokens> {
    return this.auth.register(dto, ctxFromRequest(req));
  }

  @Post('login')
  @HttpCode(200)
  login(
    @Body(new ZodValidationPipe(LoginDto)) dto: InstanceType<typeof LoginDto>,
    @Req() req: Request,
  ): Promise<AuthTokens> {
    return this.auth.login(dto, ctxFromRequest(req));
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(
    @Body(new ZodValidationPipe(RefreshDto)) dto: InstanceType<typeof RefreshDto>,
    @Req() req: Request,
  ): Promise<AuthTokens> {
    return this.auth.refresh(dto.refreshToken, ctxFromRequest(req));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Body(new ZodValidationPipe(RefreshDto)) dto: InstanceType<typeof RefreshDto>,
  ): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.auth.me(user.sub);
  }
}
