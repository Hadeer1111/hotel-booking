import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

function makeCtx(user?: { role: Role }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => 'handler',
    getClass: () => 'class',
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows when no @Roles metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(makeCtx({ role: Role.CUSTOMER }))).toBe(true);
  });

  it('allows when user role matches required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.MANAGER]);
    expect(guard.canActivate(makeCtx({ role: Role.MANAGER }))).toBe(true);
  });

  it('forbids when user role is not in required set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(makeCtx({ role: Role.CUSTOMER }))).toThrow(ForbiddenException);
  });

  it('forbids when no user is attached', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(makeCtx())).toThrow(ForbiddenException);
  });

  it('reads metadata from both handler and class via getAllAndOverride', () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    guard.canActivate(makeCtx({ role: Role.ADMIN }));
    expect(spy).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });
});
