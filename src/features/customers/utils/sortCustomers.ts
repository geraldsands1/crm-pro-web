import { compareWithBlanksLast } from '../../../lib/collection/collator';
import type { Customer, CustomerSort } from '../types';

export function customerFullName(customer: Customer): string {
  return `${customer.first_name} ${customer.last_name}`.trim();
}

function valueFor(customer: Customer, field: CustomerSort['field']): string {
  switch (field) {
    case 'name':
      return customerFullName(customer);
    case 'company':
      return customer.company_name ?? '';
    case 'status':
      return customer.status;
  }
}

/**
 * Returns a sorted copy — never mutates the input, which would corrupt
 * the array React Query is caching and make the sort order depend on how
 * many times the component happened to render.
 *
 * Rows with an empty value always sort last regardless of direction: a
 * customer with no company recorded is missing data, not "the smallest
 * company", and floating those to the top of an ascending sort buries the
 * rows the user actually wanted to see.
 */
export function sortCustomers(
  customers: readonly Customer[],
  sort: CustomerSort,
): Customer[] {
  const direction: 1 | -1 = sort.direction === 'asc' ? 1 : -1;

  return [...customers].sort((a, b) =>
    compareWithBlanksLast(
      valueFor(a, sort.field),
      valueFor(b, sort.field),
      direction,
    ),
  );
}
