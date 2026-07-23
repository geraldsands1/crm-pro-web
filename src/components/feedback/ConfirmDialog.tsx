import type { ReactNode } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Body copy. Accepts nodes so callers can emphasise a record's name. */
  description: ReactNode;
  confirmLabel: string;
  /** In-flight label, shown while `isBusy`. */
  busyLabel?: string;
  isBusy?: boolean;
  /** Server-side failure, rendered inside the dialog. */
  error?: string | null;
  confirmColor?: 'primary' | 'error';
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * The shared confirmation prompt for irreversible actions.
 *
 * The error belongs inside the dialog, not on the page behind it: when a
 * request fails the dialog stays open, so a message rendered underneath
 * would be hidden by the very dialog reporting the failure.
 *
 * Dismissal is blocked while busy — closing mid-request leaves the
 * mutation running with no way to see how it ended.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busyLabel,
  isBusy = false,
  error,
  confirmColor = 'error',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={isBusy ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      // RC2.4E accessibility: MUI traps focus and adds role="dialog", but
      // it cannot know which of the children names the dialog. Without
      // these, a screen reader announces an unlabelled dialog.
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>

      <DialogContent>
        <DialogContentText id="confirm-dialog-description" component="div">
          {description}
        </DialogContentText>

        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={isBusy}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={isBusy}
          startIcon={
            isBusy ? <CircularProgress size={18} color="inherit" /> : null
          }
        >
          {isBusy ? (busyLabel ?? 'Working…') : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
