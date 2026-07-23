/**
 * A customer row exactly as the backend returns it.
 *
 * Field names are snake_case because that is the wire format; renaming
 * them to camelCase here would mean maintaining a mapping layer in both
 * directions for no benefit while the shapes match one to one.
 *
 * Every optional field is `| null` rather than `?`: PostgreSQL returns
 * NULL for unset columns, so the key is present with a null value. Typing
 * them as optional would let `undefined` checks pass where the value is
 * actually null.
 */
export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  lead_source: string | null;
  status: string;
  notes: string | null;
  assigned_agent_id: string | null;
  /** Resolved server-side by a LEFT JOIN on users; null when unassigned. */
  assigned_agent: string | null;
  /**
   * Earned automatically by the backend when a payment crosses a
   * threshold. Never editable from this portal — it is displayed only.
   */
  is_vip: boolean;
  vip_since: string | null;
  created_at: string;
  updated_at: string | null;
}

/** The writable subset. `is_vip`, timestamps and ids are excluded. */
export interface CustomerInput {
  first_name: string;
  last_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  lead_source: string | null;
  status: string;
  notes: string | null;
  /**
   * RC2.4C: now writable from the portal. Null means unassigned. The
   * joined `assigned_agent` name on [Customer] stays read-only — it is
   * resolved server-side from this id.
   */
  assigned_agent_id: string | null;
}

/** `GET /customers/search` — a page plus the total across all pages. */
export interface CustomerPage {
  customers: Customer[];
  total: number;
}

/** Columns the list can be ordered by. */
export type CustomerSortField = 'name' | 'company' | 'status';

export type SortDirection = 'asc' | 'desc';

export interface CustomerSort {
  field: CustomerSortField;
  direction: SortDirection;
}

export interface CustomerListParams {
  /** Trimmed search term; empty string means "browse everything". */
  search: string;
  /** 1-based. */
  page: number;
  pageSize: number;
  sort: CustomerSort;
}
