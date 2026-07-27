/**
 * Payment methods offered by the form.
 *
 * The backend column is free-form, nullable TEXT with no constraint, so
 * this is a convenience list rather than an enum the server enforces.
 * Payments cannot be edited (there is no PUT route), so unlike the
 * customer status field this never has to cope with an unrecognised
 * stored value being loaded back into a control.
 */
export const PAYMENT_METHODS = [
  'Cash',
  'Card',
  'Bank Transfer',
  'UPI',
  'Other',
] as const;

export const DEFAULT_PAYMENT_METHOD = PAYMENT_METHODS[0];
