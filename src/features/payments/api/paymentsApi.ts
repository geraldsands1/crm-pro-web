import { apiClient } from '../../../lib/api/client';
import { endpoints } from '../../../lib/api/endpoints';
import { ensureSuccess } from '../../../lib/api/envelope';
import type { ApiEnvelope } from '../../../lib/api/types';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  Payment,
  PaymentHistory,
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

export const paymentsApi = {
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
