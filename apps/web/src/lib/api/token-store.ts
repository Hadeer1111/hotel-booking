/**
 * In-memory token store. Access tokens live in JS memory only (no localStorage)
 * to keep XSS blast-radius small; refresh tokens are persisted to a SameSite
 * cookie set by the API on rotation. This client-side store is hydrated from
 * /v1/auth/me on app boot.
 *
 * For the take-home / mini-system we keep it simple: refresh token also lives
 * here since the API echoes it in the JSON response. In a fully cookie-based
 * setup the refresh interceptor would just call /auth/refresh with
 * { credentials: 'include' } and no body.
 */
type Listener = () => void;

interface TokenState {
  accessToken: string | null;
  refreshToken: string | null;
}

let state: TokenState = { accessToken: null, refreshToken: null };
const listeners = new Set<Listener>();

export const tokenStore = {
  get(): TokenState {
    return state;
  },
  set(next: Partial<TokenState>): void {
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  },
  clear(): void {
    state = { accessToken: null, refreshToken: null };
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
