import type { AuthUser } from '../types';

/**
 * Where the session lives between page loads.
 *
 * localStorage, not sessionStorage: a CRM is a tool people keep open
 * across browser restarts, and the backend already issues a 7-day token,
 * so scoping the client to a single tab would expire sessions far earlier
 * than the token itself does.
 *
 * The token is the credential; the user record is cached alongside it
 * purely so the shell can render a name on first paint instead of
 * flashing an empty header while `/auth/profile` is in flight. The cached
 * copy is never trusted on its own — see AuthProvider's restore step,
 * which always revalidates the token against the backend.
 *
 * Every read is defensive: localStorage can throw (Safari private mode,
 * disabled storage) and its contents are user-editable, so a corrupt
 * value must degrade to "signed out" rather than crash the app on boot.
 */

const TOKEN_KEY = 'crm_pro.auth.token';
const USER_KEY = 'crm_pro.auth.user';

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable or full. The session still works for this page
    // load; it simply will not survive a refresh.
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing useful to do — the caller is already signing out.
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'string' &&
    typeof candidate['email'] === 'string' &&
    typeof candidate['full_name'] === 'string' &&
    (candidate['role'] === 'admin' || candidate['role'] === 'agent')
  );
}

export const authStorage = {
  getToken(): string | null {
    return safeGet(TOKEN_KEY);
  },

  getUser(): AuthUser | null {
    const raw = safeGet(USER_KEY);
    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      return isAuthUser(parsed) ? parsed : null;
    } catch {
      // Hand-edited or truncated JSON — treat as no cached user.
      return null;
    }
  },

  save(token: string, user: AuthUser): void {
    safeSet(TOKEN_KEY, token);
    safeSet(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    safeRemove(TOKEN_KEY);
    safeRemove(USER_KEY);
  },
};
