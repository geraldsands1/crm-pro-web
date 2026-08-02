import { apiClient } from '../../../lib/api/client';
import { endpoints } from '../../../lib/api/endpoints';
import { ApiError } from '../../../lib/api/types';
import type { ApiDataResponse } from '../../../lib/api/types';
import type {
  AgentPerformance,
  AgentPerformanceRow,
  BusinessSnapshot,
  BusinessSnapshotResponse,
  CustomerGrowthTrend,
  CustomerGrowthTrendPoint,
  DashboardStats,
  DashboardStatsResponse,
  MonthlySalesTrend,
  MonthlySalesTrendPoint,
  PaymentMethodBreakdown,
  PaymentMethodBreakdownItem,
  RecentActivity,
  RecentCustomer,
  RecentPayment,
  SalesSummary,
  SalesSummaryResponse,
  TopAgent,
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

  /**
   * `GET /dashboard/recent-activity` — admin only. Latest 10 payments (CRM +
   * IMPORTED) and latest 10 customers, parsed defensively.
   */
  async getRecentActivity(): Promise<RecentActivity> {
    const { data } = await apiClient.get<ApiDataResponse<RecentActivityRaw>>(
      endpoints.dashboard.recentActivity,
    );

    if (!data.success || !data.data) {
      throw new ApiError(
        data.message ?? 'Could not load recent activity.',
        'server',
      );
    }

    const payments = Array.isArray(data.data.recentPayments)
      ? data.data.recentPayments
      : [];
    const customers = Array.isArray(data.data.recentCustomers)
      ? data.data.recentCustomers
      : [];

    return {
      recentPayments: payments.map(parseRecentPayment),
      recentCustomers: customers.map(parseRecentCustomer),
    };
  },

  /**
   * `GET /dashboard/agent-performance` — admin only. Per-agent sales +
   * commission, ranked. Amounts coerced to numbers defensively.
   */
  async getAgentPerformance(): Promise<AgentPerformance> {
    const { data } = await apiClient.get<
      ApiDataResponse<AgentPerformanceRaw>
    >(endpoints.dashboard.agentPerformance);

    if (!data.success || !data.data) {
      throw new ApiError(
        data.message ?? 'Could not load agent performance.',
        'server',
      );
    }

    const agents = Array.isArray(data.data.agents) ? data.data.agents : [];

    return {
      topAgent: data.data.topAgent ? parseTopAgent(data.data.topAgent) : null,
      agents: agents.map(parseAgentRow),
    };
  },

  /**
   * `GET /dashboard/monthly-sales-trend` — admin only. Last 12 months of
   * sales, oldest to newest. Sales coerced to numbers defensively.
   */
  async getMonthlySalesTrend(): Promise<MonthlySalesTrend> {
    const { data } = await apiClient.get<
      ApiDataResponse<MonthlySalesTrendRaw>
    >(endpoints.dashboard.monthlySalesTrend);

    if (!data.success || !data.data) {
      throw new ApiError(
        data.message ?? 'Could not load the sales trend.',
        'server',
      );
    }

    const months = Array.isArray(data.data.months) ? data.data.months : [];
    return { months: months.map(parseMonthPoint) };
  },

  /**
   * `GET /dashboard/payment-method-breakdown` — admin only. Total amount and
   * count per payment method (CRM + IMPORTED, cash excluded), each with its
   * share of the total. Amounts coerced to numbers defensively.
   */
  async getPaymentMethodBreakdown(): Promise<PaymentMethodBreakdown> {
    const { data } = await apiClient.get<
      ApiDataResponse<PaymentMethodBreakdownRaw>
    >(endpoints.dashboard.paymentMethodBreakdown);

    if (!data.success || !data.data) {
      throw new ApiError(
        data.message ?? 'Could not load the payment method breakdown.',
        'server',
      );
    }

    const methods = Array.isArray(data.data.methods)
      ? data.data.methods
      : [];
    return { methods: methods.map(parseMethodItem) };
  },

  /**
   * `GET /dashboard/customer-growth-trend` — admin only. New customers per
   * month over the last 12 months, oldest to newest. Counts coerced to
   * numbers defensively.
   */
  async getCustomerGrowthTrend(): Promise<CustomerGrowthTrend> {
    const { data } = await apiClient.get<
      ApiDataResponse<CustomerGrowthTrendRaw>
    >(endpoints.dashboard.customerGrowthTrend);

    if (!data.success || !data.data) {
      throw new ApiError(
        data.message ?? 'Could not load the customer growth trend.',
        'server',
      );
    }

    const months = Array.isArray(data.data.months) ? data.data.months : [];
    return { months: months.map(parseGrowthPoint) };
  },
};

interface CustomerGrowthTrendRaw {
  months?: unknown[];
}

function parseGrowthPoint(raw: unknown): CustomerGrowthTrendPoint {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    month: str(r.month),
    label: str(r.label) || str(r.month),
    customers: toNumber(r.customers),
  };
}

interface PaymentMethodBreakdownRaw {
  methods?: unknown[];
}

function parseMethodItem(raw: unknown): PaymentMethodBreakdownItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    method: str(r.method) || 'Unknown',
    totalAmount: toNumber(r.totalAmount),
    paymentCount: toNumber(r.paymentCount),
    percentage: toNumber(r.percentage),
  };
}

interface MonthlySalesTrendRaw {
  months?: unknown[];
}

function parseMonthPoint(raw: unknown): MonthlySalesTrendPoint {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    month: str(r.month),
    label: str(r.label) || str(r.month),
    sales: toNumber(r.sales),
  };
}

interface AgentPerformanceRaw {
  topAgent?: unknown;
  agents?: unknown[];
}

function parseTopAgent(raw: unknown): TopAgent {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    agentId: str(r.agentId),
    agentName: str(r.agentName) || 'Unknown',
    totalSales: toNumber(r.totalSales),
    thisMonthSales: toNumber(r.thisMonthSales),
    totalCommission: toNumber(r.totalCommission),
    pendingCommission: toNumber(r.pendingCommission),
    paidCommission: toNumber(r.paidCommission),
    customerCount: toNumber(r.customerCount),
  };
}

function parseAgentRow(raw: unknown): AgentPerformanceRow {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    rank: toNumber(r.rank),
    agentId: str(r.agentId),
    agentName: str(r.agentName) || 'Unknown',
    email: nullableStr(r.email),
    totalSales: toNumber(r.totalSales),
    thisMonthSales: toNumber(r.thisMonthSales),
    totalCommission: toNumber(r.totalCommission),
    pendingCommission: toNumber(r.pendingCommission),
    paidCommission: toNumber(r.paidCommission),
    customerCount: toNumber(r.customerCount),
  };
}

interface RecentActivityRaw {
  recentPayments?: unknown[];
  recentCustomers?: unknown[];
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function parseRecentPayment(raw: unknown): RecentPayment {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    customerId: str(r.customerId),
    customerName: str(r.customerName) || 'Unknown',
    amount: toNumber(r.amount),
    method: nullableStr(r.method),
    source: str(r.source),
    paidAt: str(r.paidAt),
    createdAt: str(r.createdAt),
  };
}

function parseRecentCustomer(raw: unknown): RecentCustomer {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    customerName: str(r.customerName) || 'Unknown',
    phone: nullableStr(r.phone),
    email: nullableStr(r.email),
    status: str(r.status),
    createdAt: str(r.createdAt),
  };
}
