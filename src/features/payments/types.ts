/**
 * A payment, as `GET /api/payments?customer_id=` returns it.
 *
 * Field names follow the wire format exactly. Two of them read oddly
 * next to the rest of this codebase and are worth naming: the column is
 * `note` (singular), not `notes` as on customers, and the date is
 * `paid_at`, not `payment_date`. Renaming either here would only hide the
 * mismatch from the next person reading a network tab.
 */
export interface Payment {
  id: string;
  customer_id: string;
  /**
   * NUMERIC(12,2) server-side, which node-postgres serialises as a
   * STRING to avoid losing precision. Typed as it actually arrives —
   * `parsePaymentAmount` is the one place it becomes a number.
   */
  amount: string | number;
  method: string | null;
  note: string | null;
  paid_at: string;
  created_by: string | null;
  created_at: string;
  /** Full name of the user who recorded it, joined server-side. */
  recorded_by: string | null;
  /**
   * Optional external reference / transaction number (cheque no., bank
   * txn id, UPI ref, …). Free-form and nullable, like `method`/`note`.
   */
  reference_no: string | null;
}

/**
 * A payment as the standalone Payments list returns it: every column of
 * [Payment] plus the customer's name, joined server-side (`GET /payments`
 * without a `customer_id`). The per-customer history omits `customer_name`
 * because the customer is already known from the page it loads on.
 */
export interface PaymentListItem extends Payment {
  customer_name: string | null;
}

/**
 * "Total paid by each customer", computed in SQL over the same scope and
 * date range as the list. Never summed from the rows on screen.
 */
export interface CustomerPaymentTotal {
  customer_id: string;
  customer_name: string | null;
  total_paid: number;
  payment_count: number;
  last_payment_at: string | null;
}

/** `GET /api/payments[?from=&to=]` — the standalone Payments module. */
export interface PaymentsList {
  payments: PaymentListItem[];
  totals: CustomerPaymentTotal[];
}

/**
 * The totals the backend computes in SQL.
 *
 * These are always taken from the server and never derived from the rows
 * on screen: the aggregate is calculated over the whole payments table
 * for that customer, so summing the visible list would quietly disagree
 * the moment the history is filtered or paged.
 */
export interface PaymentSummary {
  total_paid: number;
  payment_count: number;
  last_payment_at: string | null;
}

export interface PaymentHistory {
  payments: Payment[];
  /**
   * Null when the response carried no summary — an older backend. The UI
   * reports the totals as unavailable rather than inventing them.
   */
  summary: PaymentSummary | null;
}

/** `POST /api/payments`. */
export interface CreatePaymentInput {
  customer_id: string;
  amount: number;
  method: string | null;
  note: string | null;
  /** ISO-8601. Omitted server-side defaults to NOW(). */
  paid_at: string;
  /** Optional external reference / transaction number. */
  reference_no: string | null;
}

/**
 * The create response.
 *
 * `vip_granted` is true only when THIS payment is what pushed the
 * customer over a VIP threshold — the backend evaluates that inside the
 * same request. The portal only reports it; none of the rule lives here.
 */
export interface CreatePaymentResult {
  payment: Payment;
  vipGranted: boolean;
}
