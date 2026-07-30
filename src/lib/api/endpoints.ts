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
    /** GET — total / today / this-month sales (all payments). Admin only. */
    salesSummary: '/dashboard/sales-summary',
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
    /**
     * GET commission stats for one agent (RC2.8). Admin any; an agent
     * only their own — enforced server-side.
     */
    commission: (id: string) => `/agents/${id}/commission`,
  },
  payments: {
    /** GET (`?customer_id=`) and POST (record). There is no PUT route. */
    root: '/payments',
    /** DELETE only. Admin only, server-enforced. */
    byId: (id: string) => `/payments/${id}`,
  },
  commissionLedger: {
    /** GET — ledger entries, scoped by JWT role (agent: own; admin: all). */
    root: '/commission-ledger',
    /** GET — aggregate figures (pending/paid/total/this + last month). */
    summary: '/commission-ledger/summary',
    /** PATCH — mark one entry Paid. Admin only, server-enforced. */
    pay: (id: string) => `/commission-ledger/${id}/pay`,
  },
  imports: {
    /** GET — download the .xlsx import template. Admin only. */
    template: '/imports/template',
    /** POST (multipart) — upload + parse + stage; returns importId + summary. */
    upload: '/imports/upload',
    /** GET — preview counts + row-level errors for a staged import. */
    preview: (id: string) => `/imports/${id}/preview`,
    /** POST — commit the import with a chosen action. */
    commit: (id: string) => `/imports/${id}/commit`,
    /** GET — download the CSV error report for an import. */
    errors: (id: string) => `/imports/${id}/errors`,
  },
} as const;
