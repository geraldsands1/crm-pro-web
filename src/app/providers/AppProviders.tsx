import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '../../features/auth/context/AuthProvider';
import { ApiError } from '../../lib/api/types';
import { theme } from '../theme/theme';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * RC2.4E: retrying a 4xx is always wasted work.
 *
 * A 401 is already being handled by the Axios interceptor (session
 * cleared, redirect under way), a 403 will never start succeeding, and a
 * 404 will not conjure a record — three extra requests only delay the
 * message the user needs. Transient failures (network, 5xx) still get two
 * further attempts.
 *
 * Defined once as a client default so individual hooks no longer repeat
 * the same predicate; four of them did before this pass.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    if (
      error.kind === 'unauthorized' ||
      error.kind === 'forbidden' ||
      error.kind === 'client'
    ) {
      return false;
    }
  }
  return failureCount < 2;
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Admin figures do not change second to second, and refetching
        // the whole dashboard every time the window regains focus is
        // noise. Explicit refetches (the Retry button) still work.
        refetchOnWindowFocus: false,
        staleTime: 60_000,
        retry: shouldRetry,
      },
      mutations: {
        // A write is never retried automatically: replaying a POST that
        // may have already committed would create a duplicate payment or
        // customer. The user retries deliberately.
        retry: false,
      },
    },
  });
}

/**
 * Every cross-cutting provider, in the order the app depends on.
 *
 * The nesting is not arbitrary:
 *
 *   QueryClientProvider  outermost — AuthProvider calls useQueryClient()
 *                        to clear cached data on sign-out, so it must be
 *                        able to see a client above it.
 *   ThemeProvider        MUI styling, plus CssBaseline's reset.
 *   BrowserRouter        must sit above AuthProvider's consumers, since
 *                        ProtectedRoute redirects with router primitives.
 *   AuthProvider         innermost of the four, so it can use the router
 *                        and the query client, and everything it wraps
 *                        can call useAuth().
 *
 * The client is created inside `useState` rather than at module scope so
 * it is stable across re-renders but not shared between test instances or
 * recreated by Fast Refresh mid-session.
 */
export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
