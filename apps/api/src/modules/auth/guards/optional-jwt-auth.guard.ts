import {
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';

/**
 * Populates `req.user` when a valid Bearer access token is present; otherwise
 * continues unauthenticated. Used for catalogue endpoints that serve guests
 * (ACTIVE hotels only) but must recognise ADMIN/MANAGER for staff-only flags.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
    }>();
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      return true;
    }
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }

  override handleRequest<TUser>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      return undefined as TUser;
    }
    return user;
  }
}
