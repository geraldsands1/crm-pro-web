import { Alert, AlertTitle, Box, Button } from '@mui/material';

interface ErrorStateProps {
  title?: string;
  message: string;
  /** When provided, renders a retry action. */
  onRetry?: () => void;
}

/**
 * Standard failure panel.
 *
 * Takes an already-humanised `message` — the Axios interceptor produces
 * those, so nothing here has to interpret a status code, and every
 * feature reports failures in the same voice.
 */
export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <Alert
        severity="error"
        sx={{ width: '100%', maxWidth: 640 }}
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : null
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
}
