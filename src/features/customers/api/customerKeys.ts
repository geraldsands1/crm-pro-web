import type { CustomerListParams } from '../types';

/**
 * Query keys for the customer module.
 *
 * Hierarchical on purpose: every key starts with `['customers']`, so a
 * mutation can invalidate the whole feature with one call rather than
 * enumerating each cached list page and detail. That is what keeps the
 * list fresh after a create, edit or delete without any hand-written
 * cache surgery.
 *
 *   ['customers']                          → everything
 *   ['customers','list']                   → every list/search variant
 *   ['customers','list', { …params }]      → one page of one query
 *   ['customers','detail']                 → every single-customer entry
 *   ['customers','detail', id]             → one customer
 */
export const customerKeys = {
  all: ['customers'] as const,

  lists: () => [...customerKeys.all, 'list'] as const,

  /**
   * Browse mode fetches the full collection once and paginates in
   * memory, so page/size/sort are deliberately NOT part of this key —
   * turning a page must not refetch. Only the search term is.
   */
  list: (search: string) => [...customerKeys.lists(), { search }] as const,

  /**
   * Search mode paginates on the server, so page and size DO belong in
   * the key: each page is a distinct request with a distinct result.
   */
  search: (params: Pick<CustomerListParams, 'search' | 'page' | 'pageSize'>) =>
    [
      ...customerKeys.lists(),
      'search',
      {
        search: params.search,
        page: params.page,
        pageSize: params.pageSize,
      },
    ] as const,

  details: () => [...customerKeys.all, 'detail'] as const,

  detail: (id: string) => [...customerKeys.details(), id] as const,
};
