import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';

interface DeleteCustomerDialogProps {
  open: boolean;
  customerName: string;
  isDeleting: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Delete confirmation for a customer.
 *
 * RC2.4C: the dialog mechanics — busy state, in-dialog error, blocked
 * dismissal while a request is in flight — moved to the shared
 * `ConfirmDialog` when agents needed exactly the same behaviour. What is
 * left here is only the wording, which is genuinely customer-specific:
 * deleting a customer cascades to their payments, and the prompt has to
 * say so.
 */
export function DeleteCustomerDialog({
  open,
  customerName,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: DeleteCustomerDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete this customer?"
      description={
        <>
          <strong>{customerName}</strong> will be permanently deleted, along
          with their payment history. This cannot be undone.
        </>
      }
      confirmLabel="Delete"
      busyLabel="Deleting…"
      isBusy={isDeleting}
      error={error ?? null}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
