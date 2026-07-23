/**
 * Defaults shared by every paginated, searchable list in the portal.
 *
 * RC2.4E: the customers and agents modules declared identical copies of
 * all three. Two tables that page differently is a bug nobody reports —
 * it just feels inconsistent — so the numbers live together.
 */

/** Rows per page. Matches the backend's own default `limit` of 20. */
export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

/** Quiet period before a search term is acted on, in milliseconds. */
export const SEARCH_DEBOUNCE_MS = 300;
