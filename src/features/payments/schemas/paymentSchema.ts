import { z } from 'zod';

import { DEFAULT_PAYMENT_METHOD } from '../constants';
import type { CreatePaymentInput } from '../types';

/**
 * Two decimal places at most, matching the NUMERIC(12,2) column.
 *
 * Checked as TEXT before the value becomes a number, which is the only
 * point where the distinction survives: 10.999 parses to a perfectly
 * valid float, so a numeric check could not tell it apart from 11 — the
 * server would silently round it and the recorded amount would differ
 * from what was typed.
 */
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * Validation for recording a payment.
 *
 * Amount is handled as a string because that is what the input produces,
 * and because the decimal-places rule has to be applied to the typed text
 * rather than to a parsed float.
 */
export const paymentSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'Enter an amount.')
    .refine(
      (value) => AMOUNT_PATTERN.test(value),
      'Enter a valid amount with at most two decimal places.',
    )
    // Ordered after the pattern check so "abc" reports a format problem
    // rather than the confusing "must be greater than 0".
    .refine((value) => Number(value) > 0, 'Amount must be greater than 0.')
    .transform((value) => Number(value)),

  method: z.string().trim().min(1, 'Select a payment method.'),

  paid_at: z
    .string()
    .trim()
    .min(1, 'Choose a payment date.')
    .refine(
      (value) => !Number.isNaN(new Date(value).getTime()),
      'Choose a valid date.',
    ),

  note: z
    .string()
    .trim()
    .max(500, 'Must be 500 characters or fewer.')
    // Blank means "no note", which is NULL in the database — an empty
    // string would render as a present-but-empty note in the table.
    .transform((value) => (value === '' ? null : value)),

  // Optional external reference / transaction number. Same blank-to-NULL
  // treatment as `note`.
  reference_no: z
    .string()
    .trim()
    .max(100, 'Must be 100 characters or fewer.')
    .transform((value) => (value === '' ? null : value)),
});

export type PaymentFormValues = z.input<typeof paymentSchema>;
export type PaymentFormOutput = z.output<typeof paymentSchema>;

/** `yyyy-MM-dd`, the format a native date input requires. */
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function emptyPaymentFormValues(): PaymentFormValues {
  return {
    amount: '',
    method: DEFAULT_PAYMENT_METHOD,
    paid_at: toDateInputValue(new Date()),
    note: '',
    reference_no: '',
  };
}

/**
 * Builds the request body.
 *
 * The date input yields a bare `yyyy-MM-dd`, which `new Date()` reads as
 * UTC midnight — in a negative-offset timezone that lands on the previous
 * day once the server renders it back. Splitting the parts and building a
 * LOCAL date keeps the payment on the day the user actually picked.
 */
export function toCreatePaymentInput(
  customerId: string,
  values: PaymentFormOutput,
): CreatePaymentInput {
  const [year, month, day] = values.paid_at.split('-').map(Number);

  const paidAt =
    year !== undefined && month !== undefined && day !== undefined
      ? new Date(year, month - 1, day)
      : new Date(values.paid_at);

  return {
    customer_id: customerId,
    amount: values.amount,
    method: values.method,
    note: values.note,
    paid_at: paidAt.toISOString(),
    reference_no: values.reference_no,
  };
}
