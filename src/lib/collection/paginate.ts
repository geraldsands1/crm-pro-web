/**
 * Slices one page out of an in-memory collection.
 *
 * Several endpoints in this backend return their whole result set with no
 * page or limit parameter, so the portal pages those client-side. This is
 * the one place that arithmetic lives — an off-by-one between two
 * hand-written copies produces a page that silently skips or repeats a
 * row, which is very hard to spot by eye.
 *
 * `page` is 1-based, matching both the API's own convention and the URL.
 */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): T[] {
  const safePage = Math.max(1, Math.floor(page));
  const safeSize = Math.max(1, Math.floor(pageSize));
  const start = (safePage - 1) * safeSize;

  return items.slice(start, start + safeSize);
}

/**
 * Clamps a page number to what a collection of `total` items can offer.
 *
 * Guards the case where the current page stops existing — deleting the
 * last row on page 3, or narrowing a search — which otherwise leaves the
 * user staring at an empty table that looks like a failure.
 */
export function clampPage(page: number, total: number, pageSize: number): number {
  const lastPage = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return Math.min(Math.max(1, page), lastPage);
}
