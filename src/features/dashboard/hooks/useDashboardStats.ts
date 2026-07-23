import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { dashboardApi } from '../api/dashboardApi';
import type { DashboardStats } from '../types';

/** Namespaced so future dashboard queries can be invalidated together. */
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
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
