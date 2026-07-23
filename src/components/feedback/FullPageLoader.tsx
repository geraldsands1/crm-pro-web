import { Box, CircularProgress, Typography } from '@mui/material';

interface FullPageLoaderProps {
  message?: string;
}

/**
 * Centred spinner for whole-screen waits — session restore, and any
 * future route-level suspense. Distinct from LoadingState, which fills a
 * panel inside an already-rendered shell.
 */
export function FullPageLoader({ message }: FullPageLoaderProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress />
      {message ? (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      ) : null}
    </Box>
  );
}
