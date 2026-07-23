import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { customersApi } from '../api/customersApi';
import { customerKeys } from '../api/customerKeys';
import type { Customer } from '../types';

/**
 * One customer, for the details and edit screens.
 *
 * Retry policy is the client-wide default set in AppProviders: 4xx is
 * never retried, because a 404 will not conjure a record and a 403 will
 * not start succeeding.
 */
export function useCustomer(id: string): UseQueryResult<Customer, ApiError> {
  return useQuery<Customer, ApiError>({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.getById(id),
  });
}
