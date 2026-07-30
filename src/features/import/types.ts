/** The three commit strategies the backend accepts. */
export type ImportAction =
  | 'skip_existing'
  | 'update_existing'
  | 'import_new_only';

/** Preview counts, as computed server-side over the staged rows. */
export interface ImportSummary {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  existing: number;
  newCount: number;
}

/** One flagged row in the preview error table. */
export interface ImportRowError {
  rowNumber: number;
  customerName: string | null;
  mobileNumber: string | null;
  /** All of the row's validation messages, joined for display. */
  message: string;
}

/** `GET /imports/:id/preview`. */
export interface ImportPreview {
  importId: string;
  status: string;
  summary: ImportSummary;
  rowErrors: ImportRowError[];
}

/** `POST /imports/:id/commit`. */
export interface ImportResult {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
}
