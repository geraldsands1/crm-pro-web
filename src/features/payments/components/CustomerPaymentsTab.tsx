import { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { NotificationSnackbar } from '../../../components/feedback/NotificationSnackbar';
import { PageError } from '../../../components/feedback/PageError';
import { useAuth } from '../../auth/hooks/useAuth';
import { formatCurrency, parseNumeric } from '../../../lib/format';
import { PaymentSummaryCards } from './PaymentSummaryCards';
import { PaymentTable } from './PaymentTable';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { usePaymentHistory } from '../hooks/usePaymentHistory';
import {
  useCreatePayment,
  useDeletePayment,
} from '../hooks/usePaymentMutations';
import { toCreatePaymentInput } from '../schemas/paymentSchema';
import type { PaymentFormOutput } from '../schemas/paymentSchema';
import type { Payment } from '../types';

interface CustomerPaymentsTabProps {
  customerId: string;
  customerName: string;
}

/**
 * The Payments tab of the Customer Details screen.
 *
 * Owns the composition — summary, history, record, delete — while every
 * piece it renders stays independently reusable. It lives in the payments
 * feature rather than the customers one because everything in it is
 * payment behaviour; the customers page just mounts it with an id.
 */
export function CustomerPaymentsTab({
  customerId,
  customerName,
}: CustomerPaymentsTabProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Payment | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const { data, isPending, isError, error, refetch } =
    usePaymentHistory(customerId);

  const createMutation = useCreatePayment(customerId);
  const deleteMutation = useDeletePayment(customerId);

  const handleRecord = async (values: PaymentFormOutput): Promise<void> => {
    try {
      const result = await createMutation.mutateAsync(
        toCreatePaymentInput(customerId, values),
      );

      setIsRecordOpen(false);

      // The VIP decision is entirely the backend's — this only reports
      // what it returned. `vip_granted` is true exactly once, on the
      // payment that earned the badge, so this never repeats.
      setNotification(
        result.vipGranted
          ? 'Customer has been upgraded to VIP.'
          : 'Payment recorded.',
      );
    } catch {
      // Handled: the mutation holds the error and the dialog renders it.
      // Rethrowing would surface an unhandled rejection in the console.
    }
  };

  if (isError) {
    return (
      <PageError
        error={error}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const payments = data?.payments ?? [];

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: 'flex-end', alignItems: 'center' }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            createMutation.reset();
            setIsRecordOpen(true);
          }}
        >
          Record Payment
        </Button>
      </Stack>

      {/* Straight from the backend's summary object — never summed from
          the rows below. See PaymentSummaryCards for why. */}
      <PaymentSummaryCards
        summary={data?.summary ?? null}
        isLoading={isPending}
      />

      <Box>
        <PaymentTable
          payments={payments}
          isLoading={isPending}
          canDelete={isAdmin}
          onDelete={(payment) => {
            deleteMutation.reset();
            setPendingDelete(payment);
          }}
          emptyState={
            <EmptyState
              title="No payments recorded"
              description={`Nothing has been recorded for ${customerName} yet.`}
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    createMutation.reset();
                    setIsRecordOpen(true);
                  }}
                >
                  Record Payment
                </Button>
              }
            />
          }
        />
      </Box>

      <RecordPaymentDialog
        open={isRecordOpen}
        customerName={customerName}
        isSaving={createMutation.isPending}
        submitError={createMutation.error?.message ?? null}
        onCancel={() => {
          setIsRecordOpen(false);
        }}
        onSubmit={handleRecord}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this payment?"
        description={
          <>
            The{' '}
            <strong>
              {pendingDelete
                ? formatCurrency(parseNumeric(pendingDelete.amount))
                : ''}
            </strong>{' '}
            payment will be permanently deleted and the customer's totals
            will be recalculated. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        busyLabel="Deleting…"
        isBusy={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
        onCancel={() => {
          setPendingDelete(null);
          deleteMutation.reset();
        }}
        onConfirm={() => {
          if (!pendingDelete) return;

          deleteMutation.mutate(pendingDelete.id, {
            onSuccess: () => {
              setPendingDelete(null);
              setNotification('Payment deleted.');
            },
          });
        }}
      />

      <NotificationSnackbar
        open={notification !== null}
        message={notification ?? ''}
        onClose={() => {
          setNotification(null);
        }}
      />
    </Stack>
  );
}
