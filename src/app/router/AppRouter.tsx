import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { FullPageLoader } from '../../components/feedback/FullPageLoader';
import { MainLayout } from '../../components/layout/MainLayout';
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute';
import { RoleRoute } from '../../features/auth/components/RoleRoute';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { appRoutes } from './routes';

/**
 * RC2.4E — route-level code splitting.
 *
 * Every page below the login screen is lazily imported, so the initial
 * download is the shell plus whichever page was actually requested rather
 * than all nine at once. The effect is largest for the pages most people
 * never open: an agent never loads the admin-only agent screens, and
 * nobody loads the customer form until they open it.
 *
 * `LoginPage` is deliberately NOT lazy. It is the first thing an
 * unauthenticated visitor sees, and splitting it would add a second round
 * trip to the one screen that must appear immediately.
 */
const DashboardPage = lazy(() =>
  import('../../features/dashboard/pages/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  })),
);
const CustomerListPage = lazy(() =>
  import('../../features/customers/pages/CustomerListPage').then((m) => ({
    default: m.CustomerListPage,
  })),
);
const CustomerCreatePage = lazy(() =>
  import('../../features/customers/pages/CustomerCreatePage').then((m) => ({
    default: m.CustomerCreatePage,
  })),
);
const CustomerEditPage = lazy(() =>
  import('../../features/customers/pages/CustomerEditPage').then((m) => ({
    default: m.CustomerEditPage,
  })),
);
const CustomerDetailsPage = lazy(() =>
  import('../../features/customers/pages/CustomerDetailsPage').then((m) => ({
    default: m.CustomerDetailsPage,
  })),
);
const AgentListPage = lazy(() =>
  import('../../features/agents/pages/AgentListPage').then((m) => ({
    default: m.AgentListPage,
  })),
);
const AgentCreatePage = lazy(() =>
  import('../../features/agents/pages/AgentCreatePage').then((m) => ({
    default: m.AgentCreatePage,
  })),
);
const AgentEditPage = lazy(() =>
  import('../../features/agents/pages/AgentEditPage').then((m) => ({
    default: m.AgentEditPage,
  })),
);
const ModulePlaceholderPage = lazy(() =>
  import('../../pages/ModulePlaceholderPage').then((m) => ({
    default: m.ModulePlaceholderPage,
  })),
);

/**
 * The route tree.
 *
 *   /login                     public
 *   └── ProtectedRoute         requires a session
 *       └── MainLayout         sidebar + top bar shell
 *           ├── /customers…    any signed-in role
 *           ├── /payments      placeholder (payments live on a customer)
 *           └── RoleRoute      admin only
 *               └── /agents…
 *
 * Because ProtectedRoute wraps a branch rather than each page, a page
 * added below it is protected by default — the safe direction to fail.
 * Anything unmatched lands on /dashboard, which then bounces to /login if
 * there is no session, so an unknown URL never leaves a blank screen.
 */
export function AppRouter() {
  return (
    // One Suspense boundary inside the layout, so the sidebar and top bar
    // stay on screen while a page chunk loads instead of the whole app
    // flashing to a spinner on every navigation.
    <Routes>
      <Route path={appRoutes.login} element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route
            element={
              <Suspense fallback={<FullPageLoader />}>
                <RouteOutlet />
              </Suspense>
            }
          >
            <Route path={appRoutes.dashboard} element={<DashboardPage />} />

            {/* `new` is declared before `:customerId` so it is not
                swallowed as an id. */}
            <Route path={appRoutes.customers} element={<CustomerListPage />} />
            <Route
              path={appRoutes.customerNew}
              element={<CustomerCreatePage />}
            />
            <Route
              path={appRoutes.customerEdit}
              element={<CustomerEditPage />}
            />
            <Route
              path={appRoutes.customerDetails}
              element={<CustomerDetailsPage />}
            />

            <Route
              path={appRoutes.payments}
              element={<ModulePlaceholderPage title="Payments" />}
            />

            {/* Admin-only in the router, matching the backend, where
                every /api/agents route is authorize("admin"). */}
            <Route element={<RoleRoute allow={['admin']} />}>
              <Route path={appRoutes.agents} element={<AgentListPage />} />
              <Route path={appRoutes.agentNew} element={<AgentCreatePage />} />
              <Route path={appRoutes.agentEdit} element={<AgentEditPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={appRoutes.dashboard} replace />} />
    </Routes>
  );
}

/**
 * A layout route needs an element that renders its children; `Suspense`
 * alone cannot, because it has no notion of the router's outlet. This is
 * that one-line bridge.
 */
function RouteOutlet() {
  return <Outlet />;
}
