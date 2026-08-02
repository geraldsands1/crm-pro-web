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

/** One month in the sales-trend chart. */
export interface MonthlySalesTrendPoint {
  /** Sortable key, e.g. "2026-03". */
  month: string;
  /** Display label, e.g. "Mar 2026". */
  label: string;
  sales: number;
}

/** `GET /api/dashboard/monthly-sales-trend`. */
export interface MonthlySalesTrend {
  months: MonthlySalesTrendPoint[];
}

/** The dashboard date-filter presets. */
export type DateRangePreset =
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'this-year'
  | 'last-12-months'
  | 'custom';

/**
 * An inclusive date range sent to the dashboard endpoints as ?from&to
 * (YYYY-MM-DD). Every preset resolves to a concrete range, so the query
 * layer only ever deals with `from`/`to` strings.
 */
export interface DateRange {
  from: string;
  to: string;
}

/** One row of the payment method breakdown. Cash is excluded server-side. */
export interface PaymentMethodBreakdownItem {
  /** Method label; null/blank becomes "Unknown". */
  method: string;
  totalAmount: number;
  paymentCount: number;
  /** Share of the (cash-excluded) total, 0–100. */
  percentage: number;
}

/** `GET /api/dashboard/payment-method-breakdown`. */
export interface PaymentMethodBreakdown {
  methods: PaymentMethodBreakdownItem[];
}

/** One month in the customer-growth chart. */
export interface CustomerGrowthTrendPoint {
  /** Sortable key, e.g. "2026-03". */
  month: string;
  /** Display label, e.g. "Mar 2026". */
  label: string;
  /** New customers created that month. */
  customers: number;
}

/** `GET /api/dashboard/customer-growth-trend`. */
export interface CustomerGrowthTrend {
  months: CustomerGrowthTrendPoint[];
}
