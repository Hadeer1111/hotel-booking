import type { Role } from '@prisma/client';
export declare const ROLES_KEY = "roles";
/** Restrict a route handler to one or more roles. */
export declare const Roles: (...roles: Role[]) => MethodDecorator & ClassDecorator;
