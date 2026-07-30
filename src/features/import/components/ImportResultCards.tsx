import { Box } from '@mui/material';

import { StatCard } from './StatCard';
import type { ImportResult } from '../types';

const GRID = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(4, 1fr)',
  },
} as const;

/** The four commit result counts. */
export function ImportResultCards({ result }: { result: ImportResult }) {
  return (
    <Box sx={GRID}>
      <StatCard label="Imported" value={result.importedCount} tone="success" />
      <StatCard label="Updated" value={result.updatedCount} tone="info" />
      <StatCard label="Skipped" value={result.skippedCount} tone="warning" />
      <StatCard
        label="Failed"
        value={result.failedCount}
        tone={result.failedCount > 0 ? 'error' : 'default'}
      />
    </Box>
  );
}
