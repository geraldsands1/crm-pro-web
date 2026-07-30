import { Box } from '@mui/material';

import { StatCard } from './StatCard';
import type { ImportSummary } from '../types';

const GRID = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
    lg: 'repeat(6, 1fr)',
  },
} as const;

/** The six preview counts. */
export function ImportSummaryCards({ summary }: { summary: ImportSummary }) {
  return (
    <Box sx={GRID}>
      <StatCard label="Total Rows" value={summary.total} />
      <StatCard label="Valid Rows" value={summary.valid} tone="success" />
      <StatCard
        label="Invalid Rows"
        value={summary.invalid}
        tone={summary.invalid > 0 ? 'error' : 'default'}
      />
      <StatCard
        label="Duplicate Customers"
        value={summary.duplicates}
        tone={summary.duplicates > 0 ? 'warning' : 'default'}
      />
      <StatCard label="Existing Customers" value={summary.existing} tone="info" />
      <StatCard label="New Customers" value={summary.newCount} tone="success" />
    </Box>
  );
}
