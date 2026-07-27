/**
 * Query keys for the payments module.
 *
 * Two shapes share the `['payments']` root so any mutation can refresh the
 * whole feature with one invalidation:
 *
 *   ['payments']                       → everything
 *   ['payments','history']             → every customer's history
 *   ['payments','history', customerId] → one customer's history (details tab)
 *   ['payments','list']                → every standalone-list variant
 *   ['payments','list', { from, to }]  → the standalone list for a date range
 *
 * The standalone list keys on the server-side filters only (the date
 * range); customer selection and free-text search are applied in the
 * client, so they must not spawn a new request.
 */
export const paymentKeys = {
  all: ['payments'] as const,
  histories: () => [...paymentKeys.all, 'history'] as const,
  history: (customerId: string) =>
    [...paymentKeys.histories(), customerId] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: { from: string | null; to: string | null }) =>
    [...paymentKeys.lists(), filters] as const,
};
