import { Skeleton, TableCell, TableRow } from '@mui/material';

interface TableSkeletonProps {
  columnCount: number;
  rowCount?: number;
}

/**
 * Placeholder rows shown while a table's first page loads.
 *
 * A skeleton rather than a centred spinner because it preserves the
 * table's shape: the header stays put and the page does not jump when
 * real rows arrive. `rowCount` defaults to five — enough to read as a
 * list without pretending to know how many rows are actually coming.
 */
export function TableSkeleton({ columnCount, rowCount = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columnCount }, (_, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton
                variant="text"
                // Varying the width stops the block reading as a solid
                // grey rectangle and suggests text of differing lengths.
                width={columnIndex === 0 ? '70%' : '50%'}
                height={24}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
