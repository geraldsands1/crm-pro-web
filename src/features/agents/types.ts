/**
 * An agent, as `GET /api/agents` returns it.
 *
 * The backend stores agents in the shared `users` table and selects them
 * by joining `roles` on `name = 'agent'`, so every record here is an
 * agent by construction — there is no role column in the payload and no
 * way for this endpoint to return an admin.
 *
 * `password_hash` is never selected by any agent query, so it has no
 * place in this type.
 */
export interface Agent {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  /** Null until the agent has signed in at least once. */
  last_login: string | null;
  /** RC2.8: the agent's commission rate, 0–100. Editable by an admin. */
  commission_percentage: number;
  created_at: string;
  updated_at: string | null;
}

/**
 * `GET /api/agents/:id/commission` — RC2.8 commission statistics.
 *
 * An admin may request any agent; an agent may request only their own
 * (enforced server-side from the JWT). Sales, commission and payment
 * count are aggregated from the commission snapshot stored on each
 * payment, so they reflect what was earned at the time, not a recompute
 * from the current rate.
 */
/**
 * One row of an agent's commission history — a payment they earned on,
 * with the commission snapshot frozen at the time it was recorded.
 */
export interface CommissionHistoryRow {
  id: string;
  paid_at: string;
  customer_name: string | null;
  amount: number;
  commission_rate: number | null;
  commission_amount: number | null;
}

export interface AgentCommissionStats {
  commission_percentage: number;
  total_sales: number;
  total_commission: number;
  customer_count: number;
  payments_received: number;
  /** Count of the agent's payments dated today (server timezone). */
  payments_today: number;
  /** The agent's commission history, newest first. */
  history: CommissionHistoryRow[];
}

/**
 * `POST /api/agents`.
 *
 * No role field: the insert hard-codes the agent role in SQL. Sending one
 * would be ignored, so the portal does not pretend to offer the choice.
 */
export interface CreateAgentInput {
  full_name: string;
  email: string;
  password: string;
  phone: string | null;
  /** RC2.8: commission rate 0–100. */
  commission_percentage: number;
}

/**
 * `PUT /api/agents/:id`.
 *
 * Every field is optional because the backend COALESCEs each one: null
 * means "leave this column alone". Email is absent by design — the update
 * query does not touch it, so offering an email field would be a control
 * that silently does nothing.
 */
export interface UpdateAgentInput {
  full_name?: string;
  phone?: string | null;
  is_active?: boolean;
  /** Only sent when the admin is actually setting a new password. */
  password?: string;
  /** RC2.8: commission rate 0–100. */
  commission_percentage?: number;
}

export type AgentSortField = 'name' | 'email' | 'status' | 'created';

export type SortDirection = 'asc' | 'desc';

export interface AgentSort {
  field: AgentSortField;
  direction: SortDirection;
}

/**
 * `GET /api/agents/:id/report` — the admin-only Agent Detailed Report.
 *
 * Sales come from the agent's assigned customers over BOTH payment sources
 * (CRM + IMPORTED); commission is read from the commission ledger, never
 * recomputed. Numeric fields are coerced client-side for the usual
 * NUMERIC-as-string reason.
 */
export interface AgentReportIdentity {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface AgentReportSummary {
  assignedCustomers: number;
  totalSales: number;
  thisMonthSales: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
}

export interface AgentReportPayment {
  id: string;
  customerName: string;
  amount: number;
  method: string | null;
  source: string;
  paidAt: string;
}

export interface AgentReportCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
  totalPaid: number;
}

export interface AgentReport {
  agent: AgentReportIdentity;
  summary: AgentReportSummary;
  recentPayments: AgentReportPayment[];
  customers: AgentReportCustomer[];
}
