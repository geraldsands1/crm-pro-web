import { apiClient } from '../../../lib/api/client';
import { endpoints } from '../../../lib/api/endpoints';
import { ApiError } from '../../../lib/api/types';
import type { ApiDataResponse } from '../../../lib/api/types';
import type {
  BusinessSnapshot,
  BusinessSnapshotResponse,
  DashboardStats,
  DashboardStatsResponse,
  SalesSummary,
  SalesSummaryResponse,
} from '../types';

/**
 * Coerces a value from the dashboard payload to a number.
 *
 * Necessary because PostgreSQL `NUMERIC` columns — which is what the
 * revenue sums are — come back from node-postgres as strings to avoid
 * silently losing precision. A missing or unparseable value becomes 0
 * rather than NaN: a card reading "$0.00" is wrong in a recoverable way,
 * while "$NaN" is a visible defect.
 */
function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export const dashboardApi = {
  /**
   * `GET /dashboard`.
   *
   * The response is scoped server-side by the caller's JWT — an admin
   * receives organisation-wide figures, an agent receives their own. The
   * portal sends no scope of its own, which is what keeps that decision
   * on the server where it belongs.
   */
  async getStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<
      ApiDataResponse<DashboardStatsResponse>
    >(endpoints.dashboard.stats);

    if (!data.success || !data.data) {
      throw new ApiError(
        data.message ?? 'Could not load the dashboard.',
        'server',
      );
    }

    const stats = data.data;

    return {
      totalCustomers: toNumber(stats.totalCustomers),
      todayCustomers: toNumber(stats.todayCustomers),
      totalRevenue: toNumber(stats.totalRevenue),
      todayPayments: toNumber(stats.todayPayments),
      totalVipCustomers: toNumber(stats.totalVipCustomers),
    };
  },

  /**
   * `GET /dashboard/sales-summary` — admin only. Total, today's and this
   * month's sales over ALL payments (CRM + IMPORTED). Amounts are coerced to
   * numbers for the same NUMERIC-as-string reason as the stats above.
   */
  async getSalesSummary(): Promise<SalesSummary> {
    const { data } = await apiClient.get<
      ApiDataResponse<SalesSummaryResponse>
    >(endpoints.dashboard.salesSummary);

    if (!data.success || !data.data) {
      throw new ApiError(
        data.message ?? 'Could not load the sales summary.',
        'server',
      );
    }

    return {
      totalSales: toNumber(data.data.totalSales),
      todaySales: toNumber(data.data.todaySales),
      thisMonthSales: toNumber(data.data.thisMonthSales),
    };
  },

  /**
   * `GET /dashboard/business-snapshot` — admin only. Total customers, new
   * customers this month, and active agents. Coerced to numbers for safety.
   */
  async getBusinessSnapshot(): Promise<BusinessSnapshot> {
    const { data } = await apiClient.get<
      ApiDataResponse<BusinessSnapshotResponse>
    >(endpoints.dashboard.businessSnapshot);

    if (!data.success || !data.data) {
      throw new ApiError(
        data.message ?? 'Could not load the business snapshot.',
        'server',
      );
    }

    return {
      totalCustomers: toNumber(data.data.totalCustomers),
      newCustomersThisMonth: toNumber(data.data.newCustomersThisMonth),
      activeAgents: toNumber(data.data.activeAgents),
    };
  },
};
