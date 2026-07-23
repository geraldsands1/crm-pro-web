import { createContext } from 'react';

import type { AuthContextValue } from '../types';

/**
 * The context object itself, in its own module.
 *
 * Kept apart from `AuthProvider.tsx` on purpose: a file that exports both
 * a component and a non-component breaks React Fast Refresh, so editing
 * the provider during development would force a full reload and drop the
 * session being tested.
 *
 * `null` is the "no provider above me" sentinel — `useAuth` turns that
 * into a clear error rather than handing back a half-built object.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
