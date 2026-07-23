import { useContext } from 'react';

import { AuthContext } from '../context/authContext';
import type { AuthContextValue } from '../types';

/**
 * The only supported way to read auth state.
 *
 * Throws when used outside `AuthProvider` instead of returning a default:
 * a component silently rendering as "signed out" because it sits in the
 * wrong part of the tree is a far harder bug to find than an immediate,
 * explicit error.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
