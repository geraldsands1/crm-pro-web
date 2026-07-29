import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { commissionApi } from '../api/commissionApi';
import { commissionKeys } from '../api/commissionKeys';
import type { CommissionEntry } from '../types';

/** The commission ledger table's data source (scoped server-side by role). */
export function useCommissionLedger(): UseQueryResult<
  CommissionEntry[],
  ApiError
> {
  return useQuery<CommissionEntry[], ApiError>({
    queryKey: commissionKeys.list(),
    queryFn: () => commissionApi.list(),
  });
}
