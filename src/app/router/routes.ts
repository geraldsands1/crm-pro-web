/**
 * Every path in the portal, in one place.
 *
 * Nothing navigates with a hand-typed string: the router, the sidebar and
 * the redirects in ProtectedRoute/RoleRoute all read from here, so a path
 * can be renamed once without leaving a dead link somewhere.
 */
export const appRoutes = {
  login: '/login',
  dashboard: '/dashboard',
  customers: '/customers',
  /**
   * Declared before the `:customerId` route in AppRouter, otherwise
   * "new" would be matched as a customer id and the create page would
   * never render.
   */
  customerNew: '/customers/new',
  customerDetails: '/customers/:customerId',
  customerEdit: '/customers/:customerId/edit',
  payments: '/payments',
  commission: '/commission',
  agents: '/agents',
  /** Declared before `:agentId` in AppRouter, as with customers. */
  agentNew: '/agents/new',
  agentEdit: '/agents/:agentId/edit',
} as const;

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes];
