/**
 * Typed, validated access to the build-time environment.
 *
 * Everything the app needs from `import.meta.env` is read here once, so
 * no feature module reaches into Vite's env object directly and a missing
 * variable fails loudly at startup rather than as a confusing 404 against
 * a URL like "undefined/dashboard" much later.
 */

interface AppEnv {
  /** Backend base URL, including `/api`, without a trailing slash. */
  readonly apiBaseUrl: string;
}

function readRequired(name: string, value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy .env.example to .env and set it.`,
    );
  }

  // A trailing slash would produce double-slashed request URLs once the
  // endpoint paths are appended. Normalising here means callers never
  // have to think about it.
  return trimmed.replace(/\/+$/, '');
}

export const env: AppEnv = {
  apiBaseUrl: readRequired(
    'VITE_API_BASE_URL',
    import.meta.env.VITE_API_BASE_URL,
  ),
};
