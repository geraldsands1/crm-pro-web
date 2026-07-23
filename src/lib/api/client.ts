import axios, { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { env } from '../../config/env';
import { authStorage } from '../../features/auth/storage/authStorage';
import { endpoints } from './endpoints';
import { ApiError } from './types';
import type { ApiErrorKind } from './types';

/**
 * The single Axios instance every request in the portal goes through.
 *
 * Three things live here so no feature module has to repeat them:
 *
 *   1. the base URL, from the environment;
 *   2. the Authorization header, attached per request from storage;
 *   3. error normalisation, so components receive an `ApiError` with a
 *      meaningful `kind` instead of a raw AxiosError they must unpack.
 *
 * A 30-second timeout is set deliberately: without one, Axios waits
 * forever, and a backend that accepts a connection then goes silent
 * leaves the UI spinning with no way to recover.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — Authorization
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = authStorage.getToken();

    if (token) {
      // Read fresh from storage on EVERY request rather than captured
      // once at module load: the token changes on login and logout, and a
      // captured copy would leave the first request after signing in
      // still using the previous session (or none at all).
      const headers = AxiosHeaders.from(config.headers);
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }

    return config;
  },
);

// ---------------------------------------------------------------------------
// Session expiry
// ---------------------------------------------------------------------------

/**
 * Called when the backend rejects the stored token. The AuthProvider
 * registers itself here at mount so the interceptor can drop React state
 * as well as storage — without it, a 401 would clear localStorage while
 * the in-memory user object lingered and the UI kept rendering a signed-in
 * shell until the next reload.
 */
type SessionExpiredHandler = () => void;

let onSessionExpired: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(
  handler: SessionExpiredHandler | null,
): void {
  onSessionExpired = handler;
}

// ---------------------------------------------------------------------------
// Response interceptor — 401, 403 and everything else
// ---------------------------------------------------------------------------

function messageFromResponse(error: AxiosError, fallback: string): string {
  const data = error.response?.data;

  if (typeof data === 'object' && data !== null) {
    const message = (data as Record<string, unknown>)['message'];
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(
        new ApiError('Something went wrong. Please try again.', 'server'),
      );
    }

    // No response at all — offline, DNS failure, CORS, or the timeout
    // above. Distinguished from a server error because the wording and
    // the user's next action are different ("check your connection"
    // rather than "try again later").
    if (!error.response) {
      return Promise.reject(
        new ApiError(
          'Could not reach the server. Check your connection and try again.',
          'network',
        ),
      );
    }

    // Read after the guard above so this is a definite number, not
    // `number | undefined`.
    const status = error.response.status;

    // --- 401: the session is gone -----------------------------------------
    if (status === 401) {
      // The login request is the one place a 401 is an ordinary outcome
      // (wrong password), not an expired session. Clearing storage and
      // bouncing to /login from here would be both wrong and circular —
      // the user is already on /login.
      const isLoginAttempt = error.config?.url?.includes(endpoints.auth.login);

      if (!isLoginAttempt) {
        authStorage.clear();
        onSessionExpired?.();
      }

      return Promise.reject(
        new ApiError(
          messageFromResponse(
            error,
            isLoginAttempt
              ? 'Incorrect email or password.'
              : 'Your session has expired. Please sign in again.',
          ),
          'unauthorized',
          status,
        ),
      );
    }

    // --- 403: signed in, but not permitted --------------------------------
    // Deliberately does NOT clear the session. The token is valid; this
    // account simply may not perform this action (an agent calling an
    // admin-only endpoint, or an inactive account at login). Signing the
    // user out here would be a confusing, unrecoverable response to what
    // is really a permissions message.
    if (status === 403) {
      return Promise.reject(
        new ApiError(
          messageFromResponse(
            error,
            'You do not have permission to perform this action.',
          ),
          'forbidden',
          status,
        ),
      );
    }

    const kind: ApiErrorKind = status >= 500 ? 'server' : 'client';

    return Promise.reject(
      new ApiError(
        messageFromResponse(
          error,
          kind === 'server'
            ? 'The server ran into a problem. Please try again shortly.'
            : 'That request could not be completed.',
        ),
        kind,
        status,
      ),
    );
  },
);
