import { apiClient } from '../../../lib/api/client';
import { endpoints } from '../../../lib/api/endpoints';
import { ensureSuccess } from '../../../lib/api/envelope';
import type { ApiDataResponse, ApiEnvelope } from '../../../lib/api/types';
import type { Customer, CustomerInput, CustomerPage } from '../types';

interface SearchResponse extends ApiEnvelope {
  page: number;
  limit: number;
  total: number;
  data: Customer[];
}

export const customersApi = {
  /**
   * `GET /customers` — every customer, unpaginated.
   *
   * This endpoint takes no page, limit or sort parameter and returns the
   * complete set. It backs the browse view, where the whole collection is
   * needed anyway to sort correctly across pages rather than only within
   * the twenty rows that happen to be on screen.
   */
  async getAll(): Promise<Customer[]> {
    const { data } = await apiClient.get<ApiDataResponse<Customer[]>>(
      endpoints.customers.root,
    );

    ensureSuccess(data, 'Could not load customers.');
    return Array.isArray(data.data) ? data.data : [];
  },

  /**
   * `GET /customers/search?q=&page=&limit=` — server-side search with
   * server-side pagination.
   *
   * The backend matches one free-text term across first name, last name,
   * company, email, phone and postal code, so the portal sends a single
   * `q` rather than field-by-field filters.
   */
  async search(params: {
    q: string;
    page: number;
    limit: number;
  }): Promise<CustomerPage> {
    const { data } = await apiClient.get<SearchResponse>(
      endpoints.customers.search,
      { params },
    );

    ensureSuccess(data, 'Could not search customers.');

    return {
      customers: Array.isArray(data.data) ? data.data : [],
      total: typeof data.total === 'number' ? data.total : 0,
    };
  },

  /**
   * `GET /customers/:id`.
   *
   * A 404 is surfaced as an `ApiError` with a `client` kind rather than
   * being turned into null — the details page needs to tell "no such
   * customer" apart from "the request failed", and an error carries that
   * distinction without a second return type.
   */
  async getById(id: string): Promise<Customer> {
    const { data } = await apiClient.get<ApiDataResponse<Customer>>(
      endpoints.customers.byId(id),
    );

    ensureSuccess(data, 'Could not load this customer.');
    return data.data;
  },

  /** `POST /customers`. The server stamps `created_by` from the JWT. */
  async create(input: CustomerInput): Promise<Customer> {
    const { data } = await apiClient.post<ApiDataResponse<Customer>>(
      endpoints.customers.root,
      input,
    );

    ensureSuccess(data, 'Could not create this customer.');
    return data.data;
  },

  /**
   * `PUT /customers/:id`.
   *
   * Sends only the fields this form owns. The backend performs a partial
   * update, so columns the portal never edits — `assigned_agent_id`,
   * `is_vip`, `created_by` — keep their stored values instead of being
   * overwritten.
   */
  async update(id: string, input: CustomerInput): Promise<Customer> {
    const { data } = await apiClient.put<ApiDataResponse<Customer>>(
      endpoints.customers.byId(id),
      input,
    );

    ensureSuccess(data, 'Could not save this customer.');
    return data.data;
  },

  /** `DELETE /customers/:id` — admin only, enforced server-side. */
  async remove(id: string): Promise<void> {
    const { data } = await apiClient.delete<ApiEnvelope>(
      endpoints.customers.byId(id),
    );

    ensureSuccess(data, 'Could not delete this customer.');
  },
};
