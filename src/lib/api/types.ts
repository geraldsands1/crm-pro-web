/**
 * The response envelope every CRM Pro endpoint uses.
 *
 * The backend answers with `{ success, message?, ... }` on both success
 * and failure, so `success` — not the HTTP status alone — is what tells
 * the two apart.
 */
export interface ApiEnvelope {
  success: boolean;
  message?: string;
}

/** Endpoints that return a single payload put it under `data`. */
export interface ApiDataResponse<T> extends ApiEnvelope {
  data: T;
}

/**
 * A failure the UI can render.
 *
 * Thrown by the Axios error interceptor so that no component ever has to
 * unpack an AxiosError, guess whether `response` exists, or dig for a
 * server message hidden three levels down.
 */
export class ApiError extends Error {
  readonly status: number | undefined;
  readonly kind: ApiErrorKind;

  constructor(message: string, kind: ApiErrorKind, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

/**
 * Why a request failed, in terms the UI cares about — distinct from the
 * raw status code, so a component can branch on meaning rather than on
 * numbers.
 */
export type ApiErrorKind =
  /** No response at all: offline, DNS, CORS, timeout. */
  | 'network'
  /** 401 — the session is gone or was never valid. */
  | 'unauthorized'
  /** 403 — signed in, but this account may not do this. */
  | 'forbidden'
  /** 4xx other than the two above. */
  | 'client'
  /** 5xx. */
  | 'server';
