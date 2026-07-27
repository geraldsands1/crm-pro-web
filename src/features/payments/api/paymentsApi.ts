import { apiClient } from '../../../lib/api/client';
import { endpoints } from '../../../lib/api/endpoints';
import { ensureSuccess } from '../../../lib/api/envelope';
import type { ApiEnvelope } from '../../../lib/api/types';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  CustomerPaymentTotal,
  Payment,
  PaymentHistory,
  PaymentListItem,
  PaymentsList,
  PaymentSummary,
} from '../types';

interface HistoryResponse extends ApiEnvelope {
  count: number;
  summary?: {
    total_paid?: unknown;
    payment_count?: unknown;
    last_payment_at?: unknown;
  };
  data: Payment[];
}

interface ListResponse extends ApiEnvelope {
  count: number;
  totals?: unknown;
  data: PaymentListItem[];
}

interface RawTotal {
  customer_id?: unknown;
  customer_name?: unknown;
  total_paid?: unknown;
  payment_count?: unknown;
  last_payment_at?: unknown;
}

/** Optional filters the standalone Payments list sends to the server. */
export interface PaymentListParams {
  customerId?: string | null;
  from?: string | null;
  to?: string | null;
}

interface CreateResponse extends ApiEnvelope {
  data: Payment;
  vip_granted?: unknown;
}

function toInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }
  return null;
}

function toAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Reads the server-computed summary.
 *
 * Returns null — rather than falling back to summing `data` — when the
 * response has no usable summary. The totals are an aggregate over the
 * whole payments table for that customer, so a client-side sum would be
 * a different number wearing the same label. Better to say "unavailable"
 * than to display a figure the server never agreed to.
 */
function parseSummary(
  summary: HistoryResponse['summary'],
): PaymentSummary | null {
  if (!summary) return null;

  const totalPaid = toAmount(summary.total_paid);
  const paymentCount = toInteger(summary.payment_count);

  if (totalPaid === null || paymentCount === null) return null;

  const lastPaymentAt =
    typeof summary.last_payment_at === 'string'
      ? summary.last_payment_at
      : null;

  return {
    total_paid: totalPaid,
    payment_count: paymentCount,
    last_payment_at: lastPaymentAt,
  };
}

function parseTotals(value: unknown): CustomerPaymentTotal[] {
  if (!Array.isArray(value)) return [];

  const totals: CustomerPaymentTotal[] = [];
  for (const raw of value as RawTotal[]) {
    const customerId =
      typeof raw.customer_id === 'string' ? raw.customer_id : null;
    const totalPaid = toAmount(raw.total_paid);
    const paymentCount = toInteger(raw.payment_count);
    if (customerId === null || totalPaid === null || paymentCount === null) {
      continue;
    }
    totals.push({
      customer_id: customerId,
      customer_name:
        typeof raw.customer_name === 'string' ? raw.customer_name : null,
      total_paid: totalPaid,
      payment_count: paymentCount,
      last_payment_at:
        typeof raw.last_payment_at === 'string' ? raw.last_payment_at : null,
    });
  }
  return totals;
}

export const paymentsApi = {
  /**
   * `GET /payments[?from=&to=]` — the standalone Payments module.
   *
   * With no `customer_id`, the backend returns every payment in the
   * caller's scope (an agent sees only their own book), each joined to its
   * customer's name, plus a per-customer totals breakdown — both computed
   * in SQL over the same optional date range. Customer selection and
   * free-text search are applied in the client, so they are not sent here.
   */
  async list(params: PaymentListParams = {}): Promise<PaymentsList> {
    const query: Record<string, string> = {};
    if (params.customerId) query.customer_id = params.customerId;
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;

    const { data } = await apiClient.get<ListResponse>(
      endpoints.payments.root,
      { params: query },
    );

    ensureSuccess(data, 'Could not load payments.');

    return {
      payments: Array.isArray(data.data) ? data.data : [],
      totals: parseTotals(data.totals),
    };
  },

  /**
   * `GET /payments?customer_id=<uuid>`.
   *
   * Returns the full history for one customer — the endpoint accepts no
   * page or limit — together with the totals the backend computed in SQL.
   * Ordered `paid_at DESC` server-side, so the newest payment is first
   * with no client-side sorting.
   */
  async getHistory(customerId: string): Promise<PaymentHistory> {
    const { data } = await apiClient.get<HistoryResponse>(
      endpoints.payments.root,
      { params: { customer_id: customerId } },
    );

    ensureSuccess(data, 'Could not load payments.');

    return {
      payments: Array.isArray(data.data) ? data.data : [],
      summary: parseSummary(data.summary),
    };
  },

  /**
   * `POST /payments`.
   *
   * The server stamps who recorded it from the JWT and re-evaluates the
   * customer's VIP status from the new totals inside the same request —
   * neither is this client's concern. `vip_granted` comes back true only
   * when this payment is what earned the badge.
   */
  async create(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const { data } = await apiClient.post<CreateResponse>(
      endpoints.payments.root,
      input,
    );

    ensureSuccess(data, 'Could not record this payment.');

    return {
      payment: data.data,
      // Strictly `=== true`: an older backend omits the field entirely,
      // and a missing flag must never be read as "granted".
      vipGranted: data.vip_granted === true,
    };
  },

  /** `DELETE /payments/:id` — admin only, enforced server-side. */
  async remove(id: string): Promise<void> {
    const { data } = await apiClient.delete<ApiEnvelope>(
      endpoints.payments.byId(id),
    );

    ensureSuccess(data, 'Could not delete this payment.');
  },
};
