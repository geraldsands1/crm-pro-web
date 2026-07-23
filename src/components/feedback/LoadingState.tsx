import { Box, CircularProgress } from '@mui/material';

interface LoadingStateProps {
  /** Minimum height, so the panel does not collapse and shift layout. */
  minHeight?: number;
}

/**
 * In-panel loading indicator, used while a query is in flight inside an
 * already-rendered layout.
 */
export function LoadingState({ minHeight = 200 }: LoadingStateProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  );
}
