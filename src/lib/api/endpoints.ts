/**
 * Every backend path the portal calls, relative to `env.apiBaseUrl`.
 *
 * Collected here so a route change is a one-line edit and no string
 * literal URL is typed inside a feature module. These mirror the existing
 * CRM Pro backend exactly; nothing here invents an endpoint.
 */
export const endpoints = {
  auth: {
    /** POST — email + password, returns a JWT and the user record. */
    login: '/auth/login',
    /** GET — protected; a 200 means the stored token is still valid. */
    profile: '/auth/profile',
  },
  dashboard: {
    /** GET — aggregate statistics, scoped server-side by JWT role. */
    stats: '/dashboard',
  },
  customers: {
    /** GET (all, unpaginated) and POST (create). */
    root: '/customers',
    /** GET — paginated, with an optional `q` term. */
    search: '/customers/search',
    /** GET, PUT, DELETE for one customer. */
    byId: (id: string) => `/customers/${id}`,
  },
  agents: {
    /** GET (all agents) and POST (create). Admin only, server-enforced. */
    root: '/agents',
    /** PUT and DELETE for one agent. Admin only. */
    byId: (id: string) => `/agents/${id}`,
  },
  payments: {
    /** GET (`?customer_id=`) and POST (record). There is no PUT route. */
    root: '/payments',
    /** DELETE only. Admin only, server-enforced. */
    byId: (id: string) => `/payments/${id}`,
  },
} as const;
