import { type ExecutionContext } from '@nestjs/common';
declare const OptionalJwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
/**
 * Populates `req.user` when a valid Bearer access token is present; otherwise
 * continues unauthenticated. Used for catalogue endpoints that serve guests
 * (ACTIVE hotels only) but must recognise ADMIN/MANAGER for staff-only flags.
 */
export declare class OptionalJwtAuthGuard extends OptionalJwtAuthGuard_base {
    canActivate(context: ExecutionContext): Promise<boolean>;
    handleRequest<TUser>(err: unknown, user: TUser): TUser;
}
export {};
