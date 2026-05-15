import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
/**
 * Enforces @Roles(...) annotations. Must be combined with JwtAuthGuard;
 * relies on req.user being populated by the JWT strategy.
 */
export declare class RolesGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
