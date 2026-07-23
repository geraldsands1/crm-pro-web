/**
 * The comparator every client-side sort in the portal uses.
 *
 * A plain `<` comparison orders by UTF-16 code unit, which puts every
 * capitalised name before every lowercase one and mis-sorts accented
 * characters — "Zoe" would precede "ada". `numeric` also orders
 * "Client 2" before "Client 10", which a string sort gets backwards.
 *
 * RC2.4E: customers and agents each built their own identical instance.
 * Constructing a Collator is not free, and two copies is two chances for
 * the two tables to sort differently.
 */
export const collator = new Intl.Collator('en', {
  sensitivity: 'base',
  numeric: true,
});

/**
 * Compares two values, always sorting blanks last regardless of
 * direction. A record with no company recorded is missing data, not "the
 * smallest company"; floating those to the top of an ascending sort
 * buries the rows the user actually wanted.
 */
export function compareWithBlanksLast(
  left: string,
  right: string,
  direction: 1 | -1,
): number {
  if (left === '' && right === '') return 0;
  if (left === '') return 1;
  if (right === '') return -1;

  return collator.compare(left, right) * direction;
}
