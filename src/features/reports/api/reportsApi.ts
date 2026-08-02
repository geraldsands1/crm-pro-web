import { apiClient } from '../../../lib/api/client';
import { endpoints } from '../../../lib/api/endpoints';

/**
 * Pull a filename out of a Content-Disposition header, if the server sent
 * one. Handles both `filename="x.xlsx"` and the RFC 5987 `filename*=` form.
 * Returns null when there is nothing usable, so the caller falls back to a
 * sensible default.
 */
function filenameFromDisposition(header: string | undefined): string | null {
  if (!header) return null;

  const star = /filename\*=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      return star[1];
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1] ?? null;
}

/**
 * Fetch a file through the authenticated client (so the JWT is attached) and
 * trigger a browser download. A plain <a href> would bypass the auth header.
 *
 * Prefers the server's Content-Disposition filename and falls back to the
 * given name.
 */
async function downloadFile(url: string, fallbackName: string): Promise<void> {
  const response = await apiClient.get(url, { responseType: 'blob' });

  const blob = response.data as Blob;
  const serverName = filenameFromDisposition(
    (response.headers?.['content-disposition'] as string | undefined) ??
      undefined,
  );

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = serverName ?? fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export const reportsApi = {
  /** Download the customers report (.xlsx). */
  exportCustomers(): Promise<void> {
    return downloadFile(
      endpoints.reports.exportCustomers,
      'customers-report.xlsx',
    );
  },

  /** Download the payments report (.xlsx). CRM + IMPORTED. */
  exportPayments(): Promise<void> {
    return downloadFile(
      endpoints.reports.exportPayments,
      'payments-report.xlsx',
    );
  },

  /** Download the agent performance report (.xlsx). */
  exportAgents(): Promise<void> {
    return downloadFile(endpoints.reports.exportAgents, 'agents-report.xlsx');
  },

  /** Download the commission ledger report (.xlsx). */
  exportCommissions(): Promise<void> {
    return downloadFile(
      endpoints.reports.exportCommissions,
      'commissions-report.xlsx',
    );
  },
};
