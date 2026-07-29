import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { commissionApi } from '../api/commissionApi';
import { commissionKeys } from '../api/commissionKeys';
import type { CommissionSummary } from '../types';

/** The commission summary cards' data source (scoped server-side by role). */
export function useCommissionSummary(): UseQueryResult<
  CommissionSummary,
  ApiError
> {
  return useQuery<CommissionSummary, ApiError>({
    queryKey: commissionKeys.summary(),
    queryFn: () => commissionApi.summary(),
  });
}
