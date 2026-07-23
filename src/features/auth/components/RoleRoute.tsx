import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { appRoutes } from '../../../app/router/routes';
import type { UserRole } from '../types';

interface RoleRouteProps {
  /**
   * Roles permitted to see this branch. A list rather than a single role
   * so a screen open to both admin and agent needs no second component.
   */
  allow: readonly UserRole[];
}

/**
 * Authorisation on top of ProtectedRoute's authentication.
 *
 * Always nested INSIDE a ProtectedRoute, never used alone: by the time
 * this renders, the session question is already settled, so this only has
 * to answer "may this role be here?" That separation is why there is no
 * loading branch here.
 *
 * A user whose role is not allowed is redirected to the dashboard rather
 * than shown a "forbidden" screen — every signed-in user can reach the
 * dashboard, so it is a guaranteed-safe destination, and this only ever
 * triggers from a hand-typed URL (the sidebar already hides links the
 * current role cannot use).
 *
 * This is a usability guard, not a security boundary. The backend
 * authorises every request from the JWT independently; hiding a route in
 * the client protects nobody on its own.
 */
export function RoleRoute({ allow }: RoleRouteProps) {
  const { user } = useAuth();

  if (user === null || !allow.includes(user.role)) {
    return <Navigate to={appRoutes.dashboard} replace />;
  }

  return <Outlet />;
}
