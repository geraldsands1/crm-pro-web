/**
 * Query keys for the commission module.
 *
 * Both shapes share the `['commission']` root so a single invalidation after
 * marking an entry Paid refreshes the summary cards and the ledger table
 * together:
 *
 *   ['commission']            → everything
 *   ['commission','summary']  → the aggregate figures
 *   ['commission','list']     → the ledger table
 */
export const commissionKeys = {
  all: ['commission'] as const,
  summary: () => [...commissionKeys.all, 'summary'] as const,
  list: () => [...commissionKeys.all, 'list'] as const,
};
