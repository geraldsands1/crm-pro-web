import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { clampPage, paginate } from '../../../lib/collection/paginate';
import { customersApi } from '../api/customersApi';
import { customerKeys } from '../api/customerKeys';
import { sortCustomers } from '../utils/sortCustomers';
import type { Customer, CustomerListParams, CustomerPage } from '../types';

interface CustomerListResult {
  customers: Customer[];
  total: number;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => void;
  /**
   * True when ordering could only be applied to the rows on screen. See
   * this hook's doc comment — the caller surfaces it so the sort control
   * never quietly overstates what it did.
   */
  isSortScopedToPage: boolean;
}

/**
 * The Customer List's data source, covering both browse and search.
 *
 * Two modes, because the backend exposes two different shapes and
 * neither one does everything the table needs:
 *
 *   Browse (no search term)
 *     `GET /customers` returns every customer and accepts no page, limit
 *     or sort parameter. So the collection is fetched once, then sorted
 *     and sliced here. Sorting is therefore correct across the whole set,
 *     not just the visible page, and turning a page costs no request.
 *
 *   Search (term present)
 *     `GET /customers/search` does the matching AND the paging on the
 *     server, which is what "server-side search" requires. It has no sort
 *     parameter either, so ordering can only be applied to the page that
 *     came back — hence `isSortScopedToPage`.
 *
 * Both modes are hidden behind one return shape, so the page component
 * renders a table and never branches on which endpoint answered.
 */
export function useCustomerList(params: CustomerListParams): CustomerListResult {
  const { search, page, pageSize, sort } = params;
  const isSearching = search.length > 0;

  const browseQuery = useQuery<Customer[], ApiError>({
    queryKey: customerKeys.list(''),
    queryFn: () => customersApi.getAll(),
    enabled: !isSearching,
  });

  // Generics stated explicitly so the error type is ApiError, not the
  // inferred `Error` — the caller branches on `error.kind`.
  const searchQuery = useQuery<CustomerPage, ApiError>({
    queryKey: customerKeys.search({ search, page, pageSize }),
    queryFn: () =>
      customersApi.search({ q: search, page, limit: pageSize }),
    enabled: isSearching,
    // Without this the table empties on every keystroke that changes the
    // key, making the list flash between results. Holding the previous
    // page while the next one loads is what makes typing feel continuous.
    placeholderData: (previous) => previous,
  });

  const browseRows = useMemo(() => {
    const all = browseQuery.data ?? [];
    const ordered = sortCustomers(all, sort);
    // RC2.4E: clamp before slicing. Deleting the last row on a page —
    // or narrowing a filter — used to leave the user on a page that no
    // longer exists, showing an empty table that reads as a failure.
    // Matches the agent list, which already did this.
    const safePage = clampPage(page, ordered.length, pageSize);
    return paginate(ordered, safePage, pageSize);
  }, [browseQuery.data, sort, page, pageSize]);

  const searchRows = useMemo(
    () => sortCustomers(searchQuery.data?.customers ?? [], sort),
    [searchQuery.data, sort],
  );

  if (isSearching) {
    return {
      customers: searchRows,
      total: searchQuery.data?.total ?? 0,
      isPending: searchQuery.isPending,
      isFetching: searchQuery.isFetching,
      isError: searchQuery.isError,
      error: searchQuery.error,
      refetch: () => {
        void searchQuery.refetch();
      },
      isSortScopedToPage: true,
    };
  }

  return {
    customers: browseRows,
    total: browseQuery.data?.length ?? 0,
    isPending: browseQuery.isPending,
    isFetching: browseQuery.isFetching,
    isError: browseQuery.isError,
    error: browseQuery.error,
    refetch: () => {
      void browseQuery.refetch();
    },
    isSortScopedToPage: false,
  };
}
