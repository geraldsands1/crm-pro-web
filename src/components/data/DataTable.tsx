import type { ReactNode } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material';

import { TableSkeleton } from '../feedback/TableSkeleton';

export interface DataTableColumn<Row> {
  /** Stable identifier, also used as the React key for the cell. */
  id: string;
  label: string;
  /** Renders the cell. Given the whole row, not one field. */
  render: (row: Row) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Sort key passed back to `onSort`; omit to make the column unsortable. */
  sortField?: string;
  /**
   * Hides the column below this breakpoint. The table stays readable on
   * narrow screens by dropping secondary columns rather than by
   * shrinking every column until nothing is legible.
   */
  hideBelow?: 'sm' | 'md' | 'lg';
  width?: number | string;
}

interface DataTableProps<Row> {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  isLoading?: boolean;
  /** Rendered in place of the body when there are no rows. */
  emptyState?: ReactNode;
  onRowClick?: (row: Row) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

/**
 * A generic, presentational table.
 *
 * Generic over the row type so each feature keeps its own typing:
 * `columns[].render` receives a real `Customer`, not `any`, and a typo in
 * a field name is a build error rather than an empty cell.
 *
 * It owns layout, sorting affordances, the loading skeleton and the empty
 * body — but no data fetching and no sorting logic. The parent decides
 * what "sorted" means and simply passes ordered rows back down, which is
 * what lets the customer list sort a whole collection in browse mode and
 * only the current page in search mode without this component knowing.
 */
export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  isLoading = false,
  emptyState,
  onRowClick,
  sortField,
  sortDirection = 'asc',
  onSort,
}: DataTableProps<Row>) {
  const hiddenSx = (breakpoint: DataTableColumn<Row>['hideBelow']) =>
    breakpoint ? { display: { xs: 'none', [breakpoint]: 'table-cell' } } : null;

  return (
    <TableContainer component={Paper} variant="outlined">
      {/* Horizontal scroll is the fallback once columns have been hidden
          and the remaining ones still do not fit. */}
      <Table sx={{ minWidth: 720 }} size="medium">
        <TableHead>
          <TableRow>
            {columns.map((column) => {
              const isSorted = Boolean(
                column.sortField && column.sortField === sortField,
              );

              return (
                <TableCell
                  key={column.id}
                  align={column.align ?? 'left'}
                  sortDirection={isSorted ? sortDirection : false}
                  sx={{
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    width: column.width ?? 'auto',
                    ...hiddenSx(column.hideBelow),
                  }}
                >
                  {column.sortField && onSort ? (
                    <TableSortLabel
                      active={isSorted}
                      direction={isSorted ? sortDirection : 'asc'}
                      onClick={() => {
                        onSort(column.sortField as string);
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading ? (
            <TableSkeleton columnCount={columns.length} />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ border: 0 }}>
                <Box sx={{ py: 6 }}>{emptyState}</Box>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={getRowKey(row)}
                hover={Boolean(onRowClick)}
                onClick={onRowClick ? () => { onRowClick(row); } : undefined}
                // RC2.4E accessibility: a clickable row is not reachable
                // by keyboard on its own — a <tr> is not focusable and
                // fires no activation event. Making it a focusable
                // button-like row means the whole table can be driven
                // with Tab/Enter/Space rather than a mouse only. The
                // props are applied ONLY when the row is interactive, so
                // a read-only table keeps clean, unannotated semantics.
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        // Enter and Space are what a button responds to;
                        // preventDefault stops Space also scrolling.
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                sx={
                  onRowClick
                    ? {
                        cursor: 'pointer',
                        // Without a visible focus ring, keyboard users
                        // cannot tell which row they are on.
                        '&:focus-visible': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: '-2px',
                        },
                      }
                    : undefined
                }
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align ?? 'left'}
                    sx={hiddenSx(column.hideBelow)}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
