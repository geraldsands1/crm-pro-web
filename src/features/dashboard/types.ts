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
