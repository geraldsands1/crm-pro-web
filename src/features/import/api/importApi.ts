import { apiClient } from '../../../lib/api/client';
import { endpoints } from '../../../lib/api/endpoints';
import { ensureSuccess } from '../../../lib/api/envelope';
import type { ApiEnvelope } from '../../../lib/api/types';
import type {
  ImportAction,
  ImportPreview,
  ImportResult,
  ImportRowError,
} from '../types';

interface UploadResponse extends ApiEnvelope {
  importId: string;
}

interface PreviewResponse extends ApiEnvelope {
  importId: string;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateCustomers: number;
  existingCustomers: number;
  newCustomers: number;
  rowErrors: unknown[];
}

interface CommitResponse extends ApiEnvelope {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
}

function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Flatten one backend rowError into the table shape. The backend sends
 * `errors: [{ field, message }]`; we join the messages. customer_name /
 * mobile_number are read defensively — present once the preview includes them,
 * a dash otherwise (the full detail is always in the downloadable report).
 */
function parseRowError(raw: unknown): ImportRowError {
  const row = (raw ?? {}) as Record<string, unknown>;
  const errors = Array.isArray(row.errors) ? row.errors : [];
  const message = errors
    .map((e) => {
      const entry = (e ?? {}) as Record<string, unknown>;
      return typeof entry.message === 'string' ? entry.message : String(e);
    })
    .join('; ');

  return {
    rowNumber: num(row.row_number),
    customerName: nullableStr(row.customer_name),
    mobileNumber: nullableStr(row.mobile_number),
    message: message || 'Invalid row.',
  };
}

function parsePreview(data: PreviewResponse): ImportPreview {
  return {
    importId: String(data.importId),
    status: typeof data.status === 'string' ? data.status : 'preview',
    summary: {
      total: num(data.totalRows),
      valid: num(data.validRows),
      invalid: num(data.invalidRows),
      duplicates: num(data.duplicateCustomers),
      existing: num(data.existingCustomers),
      newCount: num(data.newCustomers),
    },
    rowErrors: Array.isArray(data.rowErrors)
      ? data.rowErrors.map(parseRowError)
      : [],
  };
}

/**
 * Fetch a file through the authenticated client (so the JWT is attached) and
 * trigger a browser download. A plain <a href> would bypass the auth header.
 */
async function downloadFile(url: string, fallbackName: string): Promise<void> {
  const response = await apiClient.get(url, { responseType: 'blob' });
  const blob = response.data as Blob;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export const importApi = {
  /** Download the Excel template. */
  downloadTemplate(): Promise<void> {
    return downloadFile(endpoints.imports.template, 'crm_import_template.xlsx');
  },

  /** Upload a .xlsx/.csv file (multipart) and return the new importId. */
  async upload(file: File): Promise<{ importId: string }> {
    const form = new FormData();
    // Field name MUST be exactly "file" (multer.single("file")); include the
    // filename so the multipart part carries it.
    form.append('file', file, file.name);

    // The shared apiClient defaults Content-Type to application/json. axios's
    // transformRequest sees that JSON header and serialises the FormData to
    // JSON — so the server received no file at all. Overriding the header for
    // this one request stops that conversion; the browser then sends real
    // multipart/form-data and fills in the boundary itself. The auth
    // interceptor still runs, so the JWT is attached. No other request is
    // affected.
    const { data } = await apiClient.post<UploadResponse>(
      endpoints.imports.upload,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    ensureSuccess(data, 'The file could not be uploaded.');
    return { importId: String(data.importId) };
  },

  /** Preview counts + row errors for a staged import. */
  async getPreview(importId: string): Promise<ImportPreview> {
    const { data } = await apiClient.get<PreviewResponse>(
      endpoints.imports.preview(importId),
    );
    ensureSuccess(data, 'The preview could not be loaded.');
    return parsePreview(data);
  },

  /** Commit the import with the chosen action. */
  async commit(importId: string, action: ImportAction): Promise<ImportResult> {
    const { data } = await apiClient.post<CommitResponse>(
      endpoints.imports.commit(importId),
      { action },
    );
    ensureSuccess(data, 'The import could not be completed.');
    return {
      importedCount: num(data.importedCount),
      updatedCount: num(data.updatedCount),
      skippedCount: num(data.skippedCount),
      failedCount: num(data.failedCount),
    };
  },

  /** Download the CSV error report for an import. */
  downloadErrors(importId: string): Promise<void> {
    return downloadFile(
      endpoints.imports.errors(importId),
      `import_${importId}_errors.csv`,
    );
  },
};
