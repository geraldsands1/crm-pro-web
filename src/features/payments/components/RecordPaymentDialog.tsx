import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';

import { PaymentForm } from './PaymentForm';
import { emptyPaymentFormValues } from '../schemas/paymentSchema';
import type { PaymentFormOutput } from '../schemas/paymentSchema';

interface RecordPaymentDialogProps {
  open: boolean;
  customerName: string;
  isSaving: boolean;
  submitError?: string | null;
  onCancel: () => void;
  onSubmit: (values: PaymentFormOutput) => Promise<void>;
}

/**
 * Wraps `PaymentForm` in a dialog.
 *
 * A dialog rather than a route: recording a payment is a short, focused
 * action taken while looking at a customer's history, and navigating away
 * from the numbers you are reconciling against — then back — is worse
 * than a modal for four fields.
 *
 * `emptyPaymentFormValues()` is called per open and passed through a
 * keyed form, so reopening after a save starts blank rather than
 * retaining the previous amount.
 */
export function RecordPaymentDialog({
  open,
  customerName,
  isSaving,
  submitError,
  onCancel,
  onSubmit,
}: RecordPaymentDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      // Unmounts the form on close, which is what resets React Hook
      // Form's internal state between openings.
      keepMounted={false}
      aria-labelledby="record-payment-title"
    >
      <DialogTitle id="record-payment-title">
        Record payment for {customerName}
      </DialogTitle>

      <DialogContent>
        <PaymentForm
          defaultValues={emptyPaymentFormValues()}
          onSubmit={onSubmit}
          onCancel={onCancel}
          submitLabel="Record Payment"
          submitError={submitError ?? null}
        />
      </DialogContent>
    </Dialog>
  );
}
