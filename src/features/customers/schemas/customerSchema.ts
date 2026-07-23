import { z } from 'zod';

import type { Customer, CustomerInput } from '../types';

/**
 * Turns a blank optional field into null.
 *
 * The form works in strings because that is what inputs produce, but the
 * database distinguishes "" from NULL. Storing empty strings would make
 * `city IS NULL` checks and the details page's "not recorded" fallbacks
 * both wrong, so blank means null on the way out.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .transform((value) => (value === '' ? null : value));

/**
 * Validation for Add and Edit — one schema, because the two forms accept
 * exactly the same fields. Any divergence would be a bug, not a feature.
 *
 * Only first and last name are required. The backend enforces nothing
 * beyond its column types, and a CRM has to be able to record a lead who
 * has given a name and nothing else; demanding an email here would block
 * legitimate data entry the server would happily accept.
 */
export const customerSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, 'First name is required.')
    .max(100, 'Must be 100 characters or fewer.'),
  last_name: z
    .string()
    .trim()
    .min(1, 'Last name is required.')
    .max(100, 'Must be 100 characters or fewer.'),
  company_name: optionalText(150),
  // Validated only when something was typed: `.email()` on an empty
  // string would make an optional field behave as required.
  email: z
    .string()
    .trim()
    .max(150, 'Must be 150 characters or fewer.')
    .refine(
      (value) => value === '' || z.string().email().safeParse(value).success,
      'Enter a valid email address.',
    )
    .transform((value) => (value === '' ? null : value)),
  phone: optionalText(40),
  address: optionalText(200),
  city: optionalText(100),
  state: optionalText(100),
  country: optionalText(100),
  postal_code: optionalText(20),
  lead_source: optionalText(100),
  status: z.string().trim().min(1, 'Select a status.'),
  notes: optionalText(2000),
  /**
   * RC2.4C. A UUID or null — never a free-text value, because it is
   * chosen from the agent list rather than typed. Nullable rather than
   * optional so "unassign this customer" is expressible: the backend
   * distinguishes an absent key (leave alone) from an explicit null
   * (clear it).
   */
  assigned_agent_id: z.string().trim().nullable(),
});

/**
 * The values React Hook Form holds — every field a string, since that is
 * what the inputs bind to. Distinct from the parsed output, where the
 * optional fields have become `string | null`.
 */
export type CustomerFormValues = z.input<typeof customerSchema>;

/** The validated result, ready to send to the API. */
export type CustomerFormOutput = z.output<typeof customerSchema>;

/** Blank form, used by Add. */
export function emptyCustomerFormValues(
  defaultStatus: string,
): CustomerFormValues {
  return {
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    lead_source: '',
    status: defaultStatus,
    notes: '',
    assigned_agent_id: null,
  };
}

/**
 * Existing customer to form values.
 *
 * Every null becomes '' because a controlled MUI input given `null`
 * switches to uncontrolled and React logs a warning — one of the console
 * errors this release is required not to produce.
 */
export function customerToFormValues(customer: Customer): CustomerFormValues {
  return {
    first_name: customer.first_name,
    last_name: customer.last_name,
    company_name: customer.company_name ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    address: customer.address ?? '',
    city: customer.city ?? '',
    state: customer.state ?? '',
    country: customer.country ?? '',
    postal_code: customer.postal_code ?? '',
    lead_source: customer.lead_source ?? '',
    status: customer.status,
    notes: customer.notes ?? '',
    assigned_agent_id: customer.assigned_agent_id,
  };
}

/** The parsed form output is already the API's shape. */
export function toCustomerInput(values: CustomerFormOutput): CustomerInput {
  return values;
}
