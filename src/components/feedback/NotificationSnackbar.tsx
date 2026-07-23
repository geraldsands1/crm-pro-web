import { Alert, Snackbar } from '@mui/material';
import type { AlertColor } from '@mui/material';

interface NotificationSnackbarProps {
  open: boolean;
  message: string;
  severity?: AlertColor;
  onClose: () => void;
  /** Milliseconds before auto-dismiss. */
  autoHideDuration?: number;
}

/**
 * Transient confirmation of something that already happened.
 *
 * Separate from `ErrorState` and `PageError`, which describe a screen
 * that cannot proceed — a snackbar reports a completed action and must
 * never block the view behind it.
 *
 * Anchored bottom-left so it never covers the primary action button,
 * which in this app sits at the top right of every page.
 */
export function NotificationSnackbar({
  open,
  message,
  severity = 'success',
  onClose,
  autoHideDuration = 6000,
}: NotificationSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}
