import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../../prisma/prisma.service';

interface PrismaMock {
  user: { findUnique: jest.Mock; create: jest.Mock };
}
interface PasswordMock {
  hash: jest.Mock;
  compare: jest.Mock;
}
interface TokensMock {
  issueForLogin: jest.Mock;
  rotate: jest.Mock;
  revokeByToken: jest.Mock;
  revokeAllForUser: jest.Mock;
}

function mockPrisma(): PrismaMock {
  return { user: { findUnique: jest.fn(), create: jest.fn() } };
}
function mockPassword(): PasswordMock {
  return { hash: jest.fn(), compare: jest.fn() };
}
function mockTokens(): TokensMock {
  return {
    issueForLogin: jest.fn(),
    rotate: jest.fn(),
    revokeByToken: jest.fn(),
    revokeAllForUser: jest.fn(),
  };
}

function build(prisma: PrismaMock, pw: PasswordMock, tokens: TokensMock): AuthService {
  return new AuthService(
    prisma as unknown as PrismaService,
    pw as unknown as PasswordService,
    tokens as unknown as RefreshTokenService,
  );
}

const TOKENS = { accessToken: 'a', refreshToken: 'r', accessTokenExpiresIn: 900 };
const CTX = { userAgent: 'jest', ip: '127.0.0.1' };

describe('AuthService', () => {
  describe('register', () => {
    it('rejects an already-registered email', async () => {
      const prisma = mockPrisma();
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      const svc = build(prisma, mockPassword(), mockTokens());
      await expect(
        svc.register({ email: 'a@b.c', password: 'pw', name: 'X' }, CTX),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('defaults role to CUSTOMER when not provided', async () => {
      const prisma = mockPrisma();
      const pw = mockPassword();
      const tokens = mockTokens();
      prisma.user.findUnique.mockResolvedValue(null);
      pw.hash.mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.c', role: Role.CUSTOMER });
      tokens.issueForLogin.mockResolvedValue(TOKENS);

      const svc = build(prisma, pw, tokens);
      await svc.register({ email: 'a@b.c', password: 'pw', name: 'X' }, CTX);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: Role.CUSTOMER }) }),
      );
    });

    it('uses MANAGER role when explicitly requested', async () => {
      const prisma = mockPrisma();
      const pw = mockPassword();
      const tokens = mockTokens();
      prisma.user.findUnique.mockResolvedValue(null);
      pw.hash.mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.c', role: Role.MANAGER });
      tokens.issueForLogin.mockResolvedValue(TOKENS);

      const svc = build(prisma, pw, tokens);
      await svc.register({ email: 'a@b.c', password: 'pw', name: 'X', role: 'MANAGER' }, CTX);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: Role.MANAGER }) }),
      );
    });
  });

  describe('login', () => {
    it('returns 401 for unknown email (no enumeration)', async () => {
      const prisma = mockPrisma();
      prisma.user.findUnique.mockResolvedValue(null);
      const svc = build(prisma, mockPassword(), mockTokens());
      await expect(
        svc.login({ email: 'no@one.com', password: 'pw' }, CTX),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns 401 for wrong password', async () => {
      const prisma = mockPrisma();
      const pw = mockPassword();
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.c',
        role: Role.CUSTOMER,
        passwordHash: 'h',
      });
      pw.compare.mockResolvedValue(false);
      const svc = build(prisma, pw, mockTokens());
      await expect(
        svc.login({ email: 'a@b.c', password: 'bad' }, CTX),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues tokens for valid credentials', async () => {
      const prisma = mockPrisma();
      const pw = mockPassword();
      const tokens = mockTokens();
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.c',
        role: Role.CUSTOMER,
        passwordHash: 'h',
      });
      pw.compare.mockResolvedValue(true);
      tokens.issueForLogin.mockResolvedValue(TOKENS);

      const svc = build(prisma, pw, tokens);
      await expect(svc.login({ email: 'a@b.c', password: 'pw' }, CTX)).resolves.toEqual(TOKENS);
      expect(tokens.issueForLogin).toHaveBeenCalledWith(
        { id: 'u1', email: 'a@b.c', role: Role.CUSTOMER },
        CTX,
      );
    });
  });

  describe('refresh / logout', () => {
    it('delegates refresh to RefreshTokenService.rotate', async () => {
      const tokens = mockTokens();
      tokens.rotate.mockResolvedValue(TOKENS);
      const svc = build(mockPrisma(), mockPassword(), tokens);
      await expect(svc.refresh('r1', CTX)).resolves.toEqual(TOKENS);
      expect(tokens.rotate).toHaveBeenCalledWith('r1', CTX);
    });

    it('delegates logout to RefreshTokenService.revokeByToken', async () => {
      const tokens = mockTokens();
      const svc = build(mockPrisma(), mockPassword(), tokens);
      await svc.logout('r1');
      expect(tokens.revokeByToken).toHaveBeenCalledWith('r1');
    });
  });
});
