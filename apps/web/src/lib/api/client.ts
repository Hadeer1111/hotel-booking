import type { AuthTokens, ProblemDetails } from '@hotel-booking/types';
import { env } from '../env';
import { tokenStore } from './token-store';
import { ApiError } from './api-error';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function rawFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, headers, ...rest } = options;
  const url = `${env.apiUrl}${path}`;
  const fullHeaders = new Headers(headers as HeadersInit | undefined);
  if (body !== undefined && !fullHeaders.has('content-type')) {
    fullHeaders.set('content-type', 'application/json');
  }
  if (!skipAuth) {
    const token = tokenStore.get().accessToken;
    if (token) fullHeaders.set('authorization', `Bearer ${token}`);
  }
  const res = await fetch(url, {
    ...rest,
    headers: fullHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    throw new ApiError(parsed as ProblemDetails);
  }
  return parsed as T;
}

/** Internal: refresh via /auth/refresh. Shared across callers to dedupe storms. */
async function attemptRefresh(): Promise<AuthTokens | null> {
  const refreshToken = tokenStore.get().refreshToken;
  if (!refreshToken) return null;
  try {
    const tokens = await rawFetch<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      skipAuth: true,
      skipRefresh: true,
    });
    tokenStore.set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return tokens;
  } catch {
    tokenStore.clear();
    return null;
  }
}

/**
 * Public request helper with a single-flight refresh interceptor. On a 401 we
 * try to rotate the refresh token exactly once and then retry the original
 * request. If refresh fails, the token store is cleared and the error surfaces
 * to the caller (route guards will redirect to /login).
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawFetch<T>(path, options);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401 || options.skipRefresh) {
      throw err;
    }
    refreshInFlight ??= attemptRefresh();
    const tokens = await refreshInFlight;
    refreshInFlight = null;
    if (!tokens) throw err;
    return rawFetch<T>(path, { ...options, skipRefresh: true });
  }
}

export const api = {
  get<T>(path: string, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return apiFetch<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) {
    return apiFetch<T>(path, { ...options, method: 'POST', body });
  },
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) {
    return apiFetch<T>(path, { ...options, method: 'PATCH', body });
  },
  delete<T>(path: string, options?: Omit<RequestOptions, 'body' | 'method'>) {
    return apiFetch<T>(path, { ...options, method: 'DELETE' });
  },
};
