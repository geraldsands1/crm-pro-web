import { ApiError } from './types';
import type { ApiEnvelope } from './types';

/**
 * Asserts that a `{ success, message? }` response actually succeeded.
 *
 * This backend answers 200 with `success: false` in some paths, so the
 * HTTP status alone is not enough to call a request successful — the
 * response interceptor cannot catch these, and without this check a
 * failure would flow onward as if it were data.
 *
 * RC2.4E: the customers, agents and payments API modules each carried an
 * identical private copy. One definition means one place to change if the
 * envelope ever gains a field.
 */
export function ensureSuccess<T extends ApiEnvelope>(
  data: T,
  fallbackMessage: string,
): T {
  if (!data.success) {
    throw new ApiError(data.message ?? fallbackMessage, 'server');
  }
  return data;
}
