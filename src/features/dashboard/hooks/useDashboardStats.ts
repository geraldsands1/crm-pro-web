import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { dashboardApi } from '../api/dashboardApi';
import type { DashboardStats, SalesSummary } from '../types';

/** Namespaced so future dashboard queries can be invalidated together. */
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
  salesSummary: () => [...dashboardQueryKeys.all, 'sales-summary'] as const,
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
 */
export function useSalesSummary(
  enabled: boolean,
): UseQueryResult<SalesSummary, ApiError> {
  return useQuery<SalesSummary, ApiError>({
    queryKey: dashboardQueryKeys.salesSummary(),
    queryFn: () => dashboardApi.getSalesSummary(),
    enabled,
  });
}
