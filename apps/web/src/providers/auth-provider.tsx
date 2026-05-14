'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthTokens, AuthUser, LoginInput, RegisterInput } from '@hotel-booking/types';
import { api } from '@/lib/api/client';
import { tokenStore } from '@/lib/api/token-store';
import { queryKeys } from '@/lib/api/query-keys';

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
}

interface AuthContextValue extends AuthState {
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'hb.refreshToken';

function persistRefresh(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(STORAGE_KEY, token);
  else window.localStorage.removeItem(STORAGE_KEY);
}

function readPersistedRefresh(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ user: null, status: 'loading' });

  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const me = await api.get<AuthUser>('/auth/me');
      return me;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const refreshToken = readPersistedRefresh();
    if (!refreshToken) {
      setState({ user: null, status: 'unauthenticated' });
      return;
    }
    tokenStore.set({ refreshToken });
    fetchMe().then((user) => {
      setState(
        user
          ? { user, status: 'authenticated' }
          : { user: null, status: 'unauthenticated' },
      );
    });
  }, [fetchMe]);

  // Mirror refresh-token rotations from the api client into localStorage so a
  // reload survives. Access token deliberately stays in memory only.
  useEffect(() => {
    return tokenStore.subscribe(() => {
      persistRefresh(tokenStore.get().refreshToken);
    });
  }, []);

  const handleAuthResponse = useCallback(
    async (tokens: AuthTokens): Promise<AuthUser> => {
      tokenStore.set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      const me = await api.get<AuthUser>('/auth/me');
      setState({ user: me, status: 'authenticated' });
      queryClient.setQueryData(queryKeys.auth.me(), me);
      return me;
    },
    [queryClient],
  );

  const login = useCallback<AuthContextValue['login']>(
    async (input) => {
      const tokens = await api.post<AuthTokens>('/auth/login', input, { skipAuth: true });
      return handleAuthResponse(tokens);
    },
    [handleAuthResponse],
  );

  const register = useCallback<AuthContextValue['register']>(
    async (input) => {
      const tokens = await api.post<AuthTokens>('/auth/register', input, { skipAuth: true });
      return handleAuthResponse(tokens);
    },
    [handleAuthResponse],
  );

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    const refreshToken = tokenStore.get().refreshToken;
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken }, { skipAuth: true });
      } catch {
        // ignore — token may already be revoked
      }
    }
    tokenStore.clear();
    queryClient.clear();
    setState({ user: null, status: 'unauthenticated' });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
