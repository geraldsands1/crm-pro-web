import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { setSessionExpiredHandler } from '../../../lib/api/client';
import { authApi } from '../api/authApi';
import { authStorage } from '../storage/authStorage';
import { AuthContext } from './authContext';
import type { AuthContextValue, AuthUser, LoginCredentials } from '../types';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Owns the session for the whole app: who is signed in, how they sign in
 * and out, and how a session survives a page refresh.
 *
 * Session restore, in order:
 *
 *   1. Start with `isRestoringSession = true` so ProtectedRoute holds off
 *      rather than bouncing to /login during the check. Without this step
 *      every refresh on /dashboard would flash the login page even for a
 *      perfectly valid session.
 *   2. No stored token -> signed out immediately, no request made.
 *   3. A token -> ask the backend whether it still accepts it. The token
 *      is the credential; the cached user record is only a display cache
 *      and is never treated as proof of a session on its own.
 *   4. Rejected -> clear and stay signed out. Unreachable backend ->
 *      also signed out, but the stored token is deliberately KEPT: "I
 *      couldn't ask" is not "the server said no", and discarding a valid
 *      session over a network blip would force a needless re-login.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const clearSession = useCallback(() => {
    authStorage.clear();
    setUser(null);
    // Drop every cached query. Without this, the next person to sign in
    // on this browser would briefly see the previous user's dashboard
    // figures from TanStack Query's cache before the refetch lands.
    queryClient.clear();
  }, [queryClient]);

  // The Axios 401 interceptor runs outside React and cannot call
  // setState. Registering here lets an expired token clear component
  // state too, instead of only wiping storage while the UI carries on
  // rendering a signed-in shell until the next reload.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      queryClient.clear();
    });

    return () => {
      setSessionExpiredHandler(null);
    };
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession(): Promise<void> {
      const token = authStorage.getToken();

      if (!token) {
        if (!cancelled) setIsRestoringSession(false);
        return;
      }

      try {
        const isValid = await authApi.hasValidSession();

        if (cancelled) return;

        if (isValid) {
          setUser(authStorage.getUser());
        } else {
          authStorage.clear();
          setUser(null);
        }
      } catch {
        // Backend unreachable — see this component's doc comment for why
        // the token is kept rather than cleared.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsRestoringSession(false);
      }
    }

    void restoreSession();

    return () => {
      // Guards against a state update after unmount in React 18 strict
      // mode, where this effect runs twice on mount in development.
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      const response = await authApi.login(credentials);

      // Storage first, then state: the very next request must already
      // carry the new token, and the request interceptor reads it from
      // storage. Setting state first would leave a render in which the
      // app believes it is signed in but sends no Authorization header.
      authStorage.save(response.token, response.user);
      setUser(response.user);
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isRestoringSession,
      login,
      logout,
    }),
    [user, isRestoringSession, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
