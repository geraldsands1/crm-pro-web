/**
 * Query keys for the payments module.
 *
 * Payments are only ever fetched per customer — there is no "all
 * payments" endpoint — so the customer id is part of every list key.
 * The hierarchy still allows a blanket invalidation when needed.
 *
 *   ['payments']                       → everything
 *   ['payments','history']             → every customer's history
 *   ['payments','history', customerId] → one customer's history
 */
export const paymentKeys = {
  all: ['payments'] as const,
  histories: () => [...paymentKeys.all, 'history'] as const,
  history: (customerId: string) =>
    [...paymentKeys.histories(), customerId] as const,
};
