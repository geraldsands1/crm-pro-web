import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

import { DataTable } from '../../../components/data/DataTable';
import type { DataTableColumn } from '../../../components/data/DataTable';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { PageError } from '../../../components/feedback/PageError';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { NotificationSnackbar } from '../../../components/feedback/NotificationSnackbar';
import { SEARCH_DEBOUNCE_MS } from '../../../config/list';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useAuth } from '../../auth/hooks/useAuth';
import { customersApi } from '../../customers/api/customersApi';
import { customerKeys } from '../../customers/api/customerKeys';
import { customerFullName } from '../../customers/utils/sortCustomers';
import type { Customer } from '../../customers/types';
import { ApiError } from '../../../lib/api/types';
import {
  formatCurrency,
  formatDate,
  orDash,
  parseNumeric,
} from '../../../lib/format';
import { usePaymentsList } from '../hooks/usePaymentsList';
import { useRecordPayment, useRemovePayment } from '../hooks/usePaymentMutations';
import { toCreatePaymentInput } from '../schemas/paymentSchema';
import type { PaymentFormOutput } from '../schemas/paymentSchema';
import { RecordPaymentFromListDialog } from '../components/RecordPaymentFromListDialog';
import type { CustomerPaymentTotal, PaymentListItem } from '../types';

/**
 * The standalone Payments module.
 *
 * The server returns every payment in the caller's scope (date-filtered)
 * plus a per-customer totals breakdown. Customer selection and free-text
 * search are applied here in the client — filtering the already-loaded
 * rows — so neither triggers a refetch; only the date range does.
 */
export function PaymentsListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [searchInput, setSearchInput] = useState('');
  const [customerFilter, setCustomerFilter] = useState<Customer | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PaymentListItem | null>(
    null,
  );
  const [notification, setNotification] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(
    searchInput.trim().toLowerCase(),
    SEARCH_DEBOUNCE_MS,
  );

  const { data, isPending, isFetching, isError, error, refetch } =
    usePaymentsList({ from: from || null, to: to || null });

  // Backs both the customer filter and the record dialog's picker. Reuses
  // the same query key as the Customers browse list, so it is cached and
  // shared rather than fetched twice.
  const customersQuery = useQuery<Customer[], ApiError>({
    queryKey: customerKeys.list(''),
    queryFn: () => customersApi.getAll(),
  });
  const customers = customersQuery.data ?? [];

  const recordMutation = useRecordPayment();
  const deleteMutation = useRemovePayment();

  const payments = useMemo<PaymentListItem[]>(() => {
    const rows = data?.payments ?? [];
    return rows.filter((row) => {
      if (customerFilter && row.customer_id !== customerFilter.id) return false;
      if (!debouncedSearch) return true;
      const haystack = [
        row.customer_name,
        row.method,
        row.reference_no,
        row.note,
        String(row.amount),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(debouncedSearch);
    });
  }, [data, customerFilter, debouncedSearch]);

  const totals = useMemo<CustomerPaymentTotal[]>(() => {
    const rows = data?.totals ?? [];
    return customerFilter
      ? rows.filter((row) => row.customer_id === customerFilter.id)
      : rows;
  }, [data, customerFilter]);

  const handleRecord = async (
    customerId: string,
    values: PaymentFormOutput,
  ): Promise<void> => {
    const result = await recordMutation.mutateAsync(
      toCreatePaymentInput(customerId, values),
    );
    setIsRecordOpen(false);
    setNotification(
      result.vipGranted
        ? 'Payment recorded — customer is now VIP.'
        : 'Payment recorded.',
    );
  };

  const confirmDelete = (): void => {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        setPendingDelete(null);
        setNotification('Payment deleted.');
      },
    });
  };

  const hasFilters =
    debouncedSearch.length > 0 || customerFilter !== null || from !== '' || to !== '';

  const clearFilters = (): void => {
    setSearchInput('');
    setCustomerFilter(null);
    setFrom('');
    setTo('');
  };

  const columns = useMemo<readonly DataTableColumn<PaymentListItem>[]>(
    () => [
      {
        id: 'paid_at',
        label: 'Date',
        render: (row) => formatDate(row.paid_at),
      },
      {
        id: 'customer',
        label: 'Customer',
        render: (row) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {orDash(row.customer_name)}
          </Typography>
        ),
      },
      {
        id: 'amount',
        label: 'Amount',
        align: 'right',
        render: (row) => formatCurrency(parseNumeric(row.amount)),
      },
      {
        id: 'method',
        label: 'Method',
        hideBelow: 'sm',
        render: (row) => orDash(row.method),
      },
      {
        id: 'reference_no',
        label: 'Reference',
        hideBelow: 'md',
        render: (row) => orDash(row.reference_no),
      },
      {
        id: 'recorded_by',
        label: 'Recorded By',
        hideBelow: 'lg',
        render: (row) => orDash(row.recorded_by),
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        width: 80,
        render: (row) =>
          // Admin-only, matching the backend's DELETE /payments/:id rule.
          // Hiding it is a convenience; the server rejects an agent's
          // delete regardless of what renders here.
          isAdmin ? (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setPendingDelete(row);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            '—'
          ),
      },
    ],
    [isAdmin],
  );

  const totalsColumns = useMemo<
    readonly DataTableColumn<CustomerPaymentTotal>[]
  >(
    () => [
      {
        id: 'customer',
        label: 'Customer',
        render: (row) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {orDash(row.customer_name)}
          </Typography>
        ),
      },
      {
        id: 'total_paid',
        label: 'Total Paid',
        align: 'right',
        render: (row) => formatCurrency(row.total_paid),
      },
      {
        id: 'payment_count',
        label: 'Payments',
        align: 'right',
        hideBelow: 'sm',
        render: (row) => row.payment_count,
      },
      {
        id: 'last_payment_at',
        label: 'Last Payment',
        hideBelow: 'md',
        render: (row) => formatDate(row.last_payment_at),
      },
    ],
    [],
  );

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Typography variant="h5" component="h1">
            Payments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {`${payments.length} payment${payments.length === 1 ? '' : 's'}`}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setIsRecordOpen(true);
          }}
        >
          Record Payment
        </Button>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { md: 'center' } }}
      >
        <TextField
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
          }}
          placeholder="Search customer, method, reference or note"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Autocomplete
          options={customers}
          value={customerFilter}
          onChange={(_event, value) => {
            setCustomerFilter(value);
          }}
          getOptionLabel={(option) => customerFullName(option)}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          sx={{ minWidth: { md: 220 }, width: { xs: '100%', md: 220 } }}
          renderInput={(params) => (
            <TextField {...params} label="Customer" placeholder="All" />
          )}
        />

        <TextField
          label="From"
          type="date"
          value={from}
          onChange={(event) => {
            setFrom(event.target.value);
          }}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: { xs: '100%', md: 170 } }}
        />

        <TextField
          label="To"
          type="date"
          value={to}
          onChange={(event) => {
            setTo(event.target.value);
          }}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: { xs: '100%', md: 170 } }}
        />

        {hasFilters ? (
          <Button
            startIcon={<ClearIcon />}
            onClick={clearFilters}
            sx={{ flexShrink: 0 }}
          >
            Clear
          </Button>
        ) : null}
      </Stack>

      {isError && error ? (
        <PageError error={error} onRetry={refetch} />
      ) : (
        <Box>
          <Box sx={{ height: 4 }}>
            {isFetching && !isPending ? <LinearProgress /> : null}
          </Box>

          <DataTable<PaymentListItem>
            columns={columns}
            rows={payments}
            getRowKey={(row) => row.id}
            isLoading={isPending}
            emptyState={
              <EmptyState
                title="No payments"
                description={
                  hasFilters
                    ? 'No payments match the current filters.'
                    : 'Record a payment to get started.'
                }
                action={
                  hasFilters ? (
                    <Button onClick={clearFilters}>Clear filters</Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setIsRecordOpen(true);
                      }}
                    >
                      Record Payment
                    </Button>
                  )
                }
              />
            }
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            Total paid by customer
          </Typography>

          <DataTable<CustomerPaymentTotal>
            columns={totalsColumns}
            rows={totals}
            getRowKey={(row) => row.customer_id}
            isLoading={isPending}
            emptyState={
              <EmptyState
                title="No totals"
                description="No payments in the selected range."
              />
            }
          />
        </Box>
      )}

      <RecordPaymentFromListDialog
        open={isRecordOpen}
        customers={customers}
        isSaving={recordMutation.isPending}
        submitError={recordMutation.error?.message ?? null}
        onCancel={() => {
          setIsRecordOpen(false);
          recordMutation.reset();
        }}
        onSubmit={handleRecord}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete payment"
        description={
          pendingDelete
            ? `Delete this ${formatCurrency(
                parseNumeric(pendingDelete.amount),
              )} payment${
                pendingDelete.customer_name
                  ? ` for ${pendingDelete.customer_name}`
                  : ''
              }? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        busyLabel="Deleting…"
        isBusy={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
        onCancel={() => {
          setPendingDelete(null);
          deleteMutation.reset();
        }}
        onConfirm={confirmDelete}
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
