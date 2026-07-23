import { apiClient } from '../../../lib/api/client';
import { endpoints } from '../../../lib/api/endpoints';
import { ApiError } from '../../../lib/api/types';
import type { LoginCredentials, LoginResponse, ProfileResponse } from '../types';

/**
 * Auth calls against the existing backend. Transport only — no React, no
 * storage, no navigation — so the context layer above owns all of the
 * session policy and this stays trivially reusable.
 */
export const authApi = {
  /**
   * `POST /auth/login`.
   *
   * A wrong password comes back as a 401 and is turned into an `ApiError`
   * by the response interceptor, so it surfaces as a thrown error here
   * rather than a null return — the caller has one failure path, not two.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      endpoints.auth.login,
      credentials,
    );

    // A 200 with `success: false`, or with the token missing, would
    // otherwise be stored as a valid session and fail on every later
    // request with a confusing 401.
    if (!data.success || !data.token || !data.user) {
      throw new ApiError(
        data.message ?? 'Sign in failed. Please try again.',
        'server',
      );
    }

    return data;
  },

  /**
   * `GET /auth/profile`.
   *
   * Used only to answer "is the stored token still accepted?" on boot.
   * Resolves true for a 200, false for a 401 (which the interceptor has
   * already turned into an `unauthorized` ApiError). Any other failure —
   * the server being unreachable, a 500 — is rethrown, because treating
   * it as "signed out" would log people out every time the network
   * hiccups.
   */
  async hasValidSession(): Promise<boolean> {
    try {
      const { data } = await apiClient.get<ProfileResponse>(
        endpoints.auth.profile,
      );
      return data.success === true;
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'unauthorized') {
        return false;
      }
      throw error;
    }
  },
};
