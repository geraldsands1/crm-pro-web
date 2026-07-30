import { useMemo } from 'react';
import { Typography } from '@mui/material';

import { DataTable } from '../../../components/data/DataTable';
import type { DataTableColumn } from '../../../components/data/DataTable';
import { orDash } from '../../../lib/format';
import type { ImportRowError } from '../types';

/** Row-level validation errors from the preview. */
export function ImportErrorsTable({
  rows,
}: {
  rows: readonly ImportRowError[];
}) {
  const columns = useMemo<readonly DataTableColumn<ImportRowError>[]>(
    () => [
      { id: 'row', label: 'Row', width: 80, render: (r) => r.rowNumber },
      {
        id: 'customer',
        label: 'Customer Name',
        render: (r) => orDash(r.customerName),
      },
      {
        id: 'mobile',
        label: 'Mobile Number',
        hideBelow: 'sm',
        render: (r) => orDash(r.mobileNumber),
      },
      {
        id: 'error',
        label: 'Error',
        render: (r) => (
          <Typography variant="body2" color="error.main">
            {r.message}
          </Typography>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable<ImportRowError>
      columns={columns}
      rows={rows}
      getRowKey={(r) => String(r.rowNumber)}
    />
  );
}
