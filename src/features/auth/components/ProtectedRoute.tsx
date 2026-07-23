import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { FullPageLoader } from '../../../components/feedback/FullPageLoader';
import { useAuth } from '../hooks/useAuth';
import { appRoutes } from '../../../app/router/routes';

/**
 * Gate for everything that requires a signed-in user.
 *
 * Used as a layout route, so it wraps its children via `<Outlet />` and
 * one declaration protects a whole branch of the route tree rather than
 * each page opting in and someone eventually forgetting to.
 *
 * The `isRestoringSession` branch is what makes a refresh work. On a hard
 * reload there is a moment where a stored token exists but has not been
 * revalidated yet, so `isAuthenticated` is still false. Redirecting then
 * would throw a signed-in user back to the login page on every refresh.
 * Waiting for the check to finish is the whole fix.
 *
 * The attempted location is passed along in router state so the login
 * page can return the user where they were headed instead of always
 * dumping them on the dashboard.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isRestoringSession } = useAuth();
  const location = useLocation();

  if (isRestoringSession) {
    return <FullPageLoader message="Restoring your session…" />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to={appRoutes.login} state={{ from: location }} replace />
    );
  }

  return <Outlet />;
}
