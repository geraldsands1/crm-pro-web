import { useState } from 'react';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';

import { EmptyState } from '../../../components/feedback/EmptyState';
import { PageError } from '../../../components/feedback/PageError';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { NotificationSnackbar } from '../../../components/feedback/NotificationSnackbar';
import { formatCurrency } from '../../../lib/format';
import { useAuth } from '../../auth/hooks/useAuth';
import { CommissionSummaryCards } from '../components/CommissionSummaryCards';
import { CommissionTable } from '../components/CommissionTable';
import { useCommissionSummary } from '../hooks/useCommissionSummary';
import { useCommissionLedger } from '../hooks/useCommissionLedger';
import { useMarkCommissionPaid } from '../hooks/useCommissionMutations';
import type { CommissionEntry } from '../types';

/**
 * The Commission module.
 *
 * The backend scopes both the summary and the ledger to the caller (an agent
 * sees only their own), so this page renders the same for both roles — the one
 * difference is the admin-only Mark Paid action, which the table hides for
 * agents. Marking an entry paid invalidates the whole `['commission']`
 * feature, so the cards and the table refresh together.
 */
export function CommissionPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const summaryQuery = useCommissionSummary();
  const ledgerQuery = useCommissionLedger();
  const markPaid = useMarkCommissionPaid();

  const [pendingPay, setPendingPay] = useState<CommissionEntry | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const entries = ledgerQuery.data ?? [];

  const confirmMarkPaid = (): void => {
    if (!pendingPay) return;
    markPaid.mutate(pendingPay.id, {
      onSuccess: () => {
        setPendingPay(null);
        setNotification('Commission marked as paid.');
      },
    });
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h1">
          Commission
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`}
        </Typography>
      </Box>

      <CommissionSummaryCards
        summary={summaryQuery.data}
        isLoading={summaryQuery.isPending}
      />

      {ledgerQuery.isError && ledgerQuery.error ? (
        <PageError error={ledgerQuery.error} onRetry={ledgerQuery.refetch} />
      ) : (
        <Box>
          <Box sx={{ height: 4 }}>
            {ledgerQuery.isFetching && !ledgerQuery.isPending ? (
              <LinearProgress />
            ) : null}
          </Box>

          <CommissionTable
            entries={entries}
            isLoading={ledgerQuery.isPending}
            isAdmin={isAdmin}
            payingId={markPaid.isPending ? (pendingPay?.id ?? null) : null}
            onMarkPaid={(entry) => {
              setPendingPay(entry);
            }}
            emptyState={
              <EmptyState
                title="No commissions"
                description={
                  isAdmin
                    ? 'Commission entries appear here as agents record payments.'
                    : 'Your commission entries appear here as you record payments.'
                }
              />
            }
          />
        </Box>
      )}

      <ConfirmDialog
        open={pendingPay !== null}
        title="Mark commission as paid"
        description={
          pendingPay
            ? `Mark the ${formatCurrency(
                pendingPay.commission_amount,
              )} commission${
                pendingPay.agent_name ? ` for ${pendingPay.agent_name}` : ''
              } as paid? This records the payout and cannot be undone here.`
            : ''
        }
        confirmLabel="Mark Paid"
        busyLabel="Saving…"
        confirmColor="primary"
        isBusy={markPaid.isPending}
        error={markPaid.error?.message ?? null}
        onCancel={() => {
          setPendingPay(null);
          markPaid.reset();
        }}
        onConfirm={confirmMarkPaid}
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
