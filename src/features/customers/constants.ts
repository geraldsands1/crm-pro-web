import type { CustomerSort } from './types';

export { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SEARCH_DEBOUNCE_MS } from '../../config/list';

/**
 * Status values offered by the form.
 *
 * The backend column is free-form TEXT with a default of `new`, so this
 * is a convenience list rather than an enum the server enforces. That
 * matters when editing: a customer whose stored status is not in this
 * list must not be silently rewritten, so CustomerForm appends any
 * unrecognised value instead of dropping it.
 */
export const CUSTOMER_STATUSES = ['new', 'active', 'pending', 'closed'] as const;

export const DEFAULT_SORT: CustomerSort = {
  field: 'name',
  direction: 'asc',
};
