/**
 * The subset of `GET /api/dashboard` this release renders.
 *
 * The endpoint returns more than this (agent counts, recent customers,
 * status summary); RC2.4A only needs the five headline figures, so only
 * those are modelled. Adding the rest later is additive.
 *
 * Every numeric field is typed `unknown` on the wire rather than `number`
 * on purpose — see `dashboardApi`. node-postgres returns NUMERIC
 * aggregates (the money columns) as STRINGS, so trusting the raw JSON
 * here would put `"12345.67"` into a field typed `number` and every
 * downstream format call would be operating on a lie.
 */
export interface DashboardStats {
  totalCustomers: number;
  todayCustomers: number;
  totalRevenue: number;
  todayPayments: number;
  totalVipCustomers: number;
}

/** The raw payload, before coercion. */
export interface DashboardStatsResponse {
  totalCustomers?: unknown;
  todayCustomers?: unknown;
  totalRevenue?: unknown;
  todayPayments?: unknown;
  totalVipCustomers?: unknown;
}

/**
 * `GET /api/dashboard/sales-summary` — total, today's and this month's sales
 * over ALL payments (CRM + IMPORTED). Currency amounts, coerced to numbers.
 */
export interface SalesSummary {
  totalSales: number;
  todaySales: number;
  thisMonthSales: number;
}

/** The raw sales-summary payload, before coercion. */
export interface SalesSummaryResponse {
  totalSales?: unknown;
  todaySales?: unknown;
  thisMonthSales?: unknown;
}

/**
 * `GET /api/dashboard/business-snapshot` — total customers, new customers this
 * month, and active agents. Plain counts.
 */
export interface BusinessSnapshot {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeAgents: number;
}

/** The raw business-snapshot payload, before coercion. */
export interface BusinessSnapshotResponse {
  totalCustomers?: unknown;
  newCustomersThisMonth?: unknown;
  activeAgents?: unknown;
}

/** One row in the Recent Payments table. Includes CRM vs IMPORTED source. */
export interface RecentPayment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: string | null;
  source: string;
  paidAt: string;
  createdAt: string;
}

/** One row in the Recently Added Customers table. */
export interface RecentCustomer {
  id: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
}

/** `GET /api/dashboard/recent-activity`. */
export interface RecentActivity {
  recentPayments: RecentPayment[];
  recentCustomers: RecentCustomer[];
}

/** One row of the agent ranking table. */
export interface AgentPerformanceRow {
  rank: number;
  agentId: string;
  agentName: string;
  email: string | null;
  totalSales: number;
  thisMonthSales: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  customerCount: number;
}

/** The headline agent (the top row), without rank/email. */
export interface TopAgent {
  agentId: string;
  agentName: string;
  totalSales: number;
  thisMonthSales: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  customerCount: number;
}

/** `GET /api/dashboard/agent-performance`. */
export interface AgentPerformance {
  topAgent: TopAgent | null;
  agents: AgentPerformanceRow[];
}
