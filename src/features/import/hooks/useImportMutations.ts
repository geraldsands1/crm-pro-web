import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { importApi } from '../api/importApi';
import type { ImportAction, ImportPreview, ImportResult } from '../types';

/**
 * Upload the file AND fetch its full preview (counts + row errors) as one
 * step, so the page has a single loading/error state for "Upload & Preview".
 */
export function useUploadImport(): UseMutationResult<
  ImportPreview,
  ApiError,
  File
> {
  return useMutation<ImportPreview, ApiError, File>({
    mutationFn: async (file) => {
      const { importId } = await importApi.upload(file);
      return importApi.getPreview(importId);
    },
  });
}

export function useCommitImport(
  importId: string,
): UseMutationResult<ImportResult, ApiError, ImportAction> {
  return useMutation<ImportResult, ApiError, ImportAction>({
    mutationFn: (action) => importApi.commit(importId, action),
  });
}
