import type { Role } from '@prisma/client';

/** Payload signed inside every access token. */
export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: Role;
}

/** Shape of an authenticated request user injected by JwtStrategy. */
export type AuthUser = JwtAccessPayload;

/** Token pair returned by login / refresh. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}
