import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { dashboardApi } from '../api/dashboardApi';
import type {
  AgentPerformance,
  BusinessSnapshot,
  CustomerGrowthTrend,
  DashboardStats,
  DateRange,
  MonthlySalesTrend,
  PaymentMethodBreakdown,
  RecentActivity,
  SalesSummary,
} from '../types';

/** A stable key fragment for a date range (or 'all' when none is applied). */
function rangeKey(range?: DateRange): string {
  return range ? `${range.from}:${range.to}` : 'all';
}

/**
 * Namespaced so future dashboard queries can be invalidated together. The
 * date-filtered queries include the range in their key so switching the
 * filter refetches (and caches) each range independently.
 */
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
  salesSummary: (range?: DateRange) =>
    [...dashboardQueryKeys.all, 'sales-summary', rangeKey(range)] as const,
  businessSnapshot: () =>
    [...dashboardQueryKeys.all, 'business-snapshot'] as const,
  recentActivity: (range?: DateRange) =>
    [...dashboardQueryKeys.all, 'recent-activity', rangeKey(range)] as const,
  agentPerformance: (range?: DateRange) =>
    [...dashboardQueryKeys.all, 'agent-performance', rangeKey(range)] as const,
  monthlySalesTrend: (range?: DateRange) =>
    [
      ...dashboardQueryKeys.all,
      'monthly-sales-trend',
      rangeKey(range),
    ] as const,
  paymentMethodBreakdown: (range?: DateRange) =>
    [
      ...dashboardQueryKeys.all,
      'payment-method-breakdown',
      rangeKey(range),
    ] as const,
  customerGrowthTrend: (range?: DateRange) =>
    [
      ...dashboardQueryKeys.all,
      'customer-growth-trend',
      rangeKey(range),
    ] as const,
};

/**
 * Loads the dashboard figures.
 *
 * Retry policy is the client-wide default set in AppProviders.
 */
export function useDashboardStats(): UseQueryResult<DashboardStats, ApiError> {
  return useQuery<DashboardStats, ApiError>({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: () => dashboardApi.getStats(),
  });
}

/**
 * Loads the sales summary (admin only). `enabled` is passed by the caller so
 * an agent — for whom the endpoint returns 403 — never fires the request.
 * `range`, when given, filters total sales to the selected dates.
 */
export function useSalesSummary(
  enabled: boolean,
  range?: DateRange,
): UseQueryResult<SalesSummary, ApiError> {
  return useQuery<SalesSummary, ApiError>({
    queryKey: dashboardQueryKeys.salesSummary(range),
    queryFn: () => dashboardApi.getSalesSummary(range),
    enabled,
  });
}

/**
 * Loads the business snapshot (admin only). Lifetime/current counts — not
 * date-filtered. `enabled` keeps an agent from firing the 403 request.
 */
export function useBusinessSnapshot(
  enabled: boolean,
): UseQueryResult<BusinessSnapshot, ApiError> {
  return useQuery<BusinessSnapshot, ApiError>({
    queryKey: dashboardQueryKeys.businessSnapshot(),
    queryFn: () => dashboardApi.getBusinessSnapshot(),
    enabled,
  });
}

/**
 * Loads recent activity (admin only). `range`, when given, filters payments by
 * paid_at and customers by created_at. `enabled` keeps an agent from firing
 * the 403 request.
 */
export function useRecentActivity(
  enabled: boolean,
  range?: DateRange,
): UseQueryResult<RecentActivity, ApiError> {
  return useQuery<RecentActivity, ApiError>({
    queryKey: dashboardQueryKeys.recentActivity(range),
    queryFn: () => dashboardApi.getRecentActivity(range),
    enabled,
  });
}

/**
 * Loads agent performance (admin only). `range`, when given, filters sales by
 * paid_at (commission stays lifetime). `enabled` keeps an agent from firing
 * the 403 request.
 */
export function useAgentPerformance(
  enabled: boolean,
  range?: DateRange,
): UseQueryResult<AgentPerformance, ApiError> {
  return useQuery<AgentPerformance, ApiError>({
    queryKey: dashboardQueryKeys.agentPerformance(range),
    queryFn: () => dashboardApi.getAgentPerformance(range),
    enabled,
  });
}

/**
 * Loads the monthly sales trend (admin only). `range`, when given, buckets the
 * selected months; otherwise the last 12 months. `enabled` keeps an agent from
 * firing the 403 request.
 */
export function useMonthlySalesTrend(
  enabled: boolean,
  range?: DateRange,
): UseQueryResult<MonthlySalesTrend, ApiError> {
  return useQuery<MonthlySalesTrend, ApiError>({
    queryKey: dashboardQueryKeys.monthlySalesTrend(range),
    queryFn: () => dashboardApi.getMonthlySalesTrend(range),
    enabled,
  });
}

/**
 * Loads the payment method breakdown (admin only). `range`, when given, filters
 * by paid_at (cash still excluded). `enabled` keeps an agent from firing the
 * 403 request.
 */
export function usePaymentMethodBreakdown(
  enabled: boolean,
  range?: DateRange,
): UseQueryResult<PaymentMethodBreakdown, ApiError> {
  return useQuery<PaymentMethodBreakdown, ApiError>({
    queryKey: dashboardQueryKeys.paymentMethodBreakdown(range),
    queryFn: () => dashboardApi.getPaymentMethodBreakdown(range),
    enabled,
  });
}

/**
 * Loads the customer growth trend (admin only). `range`, when given, buckets
 * the selected months; otherwise the last 12 months. `enabled` keeps an agent
 * from firing the 403 request.
 */
export function useCustomerGrowthTrend(
  enabled: boolean,
  range?: DateRange,
): UseQueryResult<CustomerGrowthTrend, ApiError> {
  return useQuery<CustomerGrowthTrend, ApiError>({
    queryKey: dashboardQueryKeys.customerGrowthTrend(range),
    queryFn: () => dashboardApi.getCustomerGrowthTrend(range),
    enabled,
  });
}
