import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

import { PageError } from '../../../components/feedback/PageError';
import { NotificationSnackbar } from '../../../components/feedback/NotificationSnackbar';
import { appRoutes } from '../../../app/router/routes';
import { useAuth } from '../../auth/hooks/useAuth';
import { CustomerStatusChip } from '../components/CustomerStatusChip';
import { CustomerProfileSummary } from '../components/CustomerProfileSummary';
import { DeleteCustomerDialog } from '../components/DeleteCustomerDialog';
import { VipBadge } from '../components/VipBadge';
import { CustomerPaymentsTab } from '../../payments/components/CustomerPaymentsTab';
import { RecordPaymentDialog } from '../../payments/components/RecordPaymentDialog';
import { usePaymentHistory } from '../../payments/hooks/usePaymentHistory';
import { useCreatePayment } from '../../payments/hooks/usePaymentMutations';
import { toCreatePaymentInput } from '../../payments/schemas/paymentSchema';
import type { PaymentFormOutput } from '../../payments/schemas/paymentSchema';
import { useCustomer } from '../hooks/useCustomer';
import { useDeleteCustomer } from '../hooks/useCustomerMutations';
import { customerFullName } from '../utils/sortCustomers';

type TabValue = 'profile' | 'payments';

interface FieldProps {
  label: string;
  value: string | null;
}

/** One labelled read-only value, with an explicit "not recorded" state. */
function Field({ label, value }: FieldProps) {
  const trimmed = value?.trim();

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
        {trimmed ? (
          trimmed
        ) : (
          <Box component="span" sx={{ color: 'text.disabled' }}>
            Not recorded
          </Box>
        )}
      </Typography>
    </Box>
  );
}

function DetailsSkeleton() {
  return (
    <Stack spacing={3}>
      <Skeleton variant="text" width={280} height={44} />
      <Card>
        <CardContent>
          <Stack spacing={2}>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} variant="text" height={28} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export function CustomerDetailsPage() {
  const { customerId = '' } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('profile');

  const { data: customer, isPending, isError, error, refetch } =
    useCustomer(customerId);
  const deleteMutation = useDeleteCustomer();

  // Payment summary for the profile (Lifetime Payments, Last Payment). Shares
  // the same query key as the Payments tab, so React Query dedupes it to one
  // request rather than fetching the history twice.
  const { data: paymentData, isPending: isSummaryPending } =
    usePaymentHistory(customerId);
  const createMutation = useCreatePayment(customerId);

  const handleRecord = async (values: PaymentFormOutput): Promise<void> => {
    try {
      const result = await createMutation.mutateAsync(
        toCreatePaymentInput(customerId, values),
      );
      setIsRecordOpen(false);
      setNotification(
        result.vipGranted
          ? 'Customer has been upgraded to VIP.'
          : 'Payment recorded.',
      );
    } catch {
      // Held by the mutation; the dialog renders the error. Rethrowing
      // would surface an unhandled rejection in the console.
    }
  };

  const backToList = (): void => {
    void navigate(appRoutes.customers);
  };

  if (isPending) return <DetailsSkeleton />;

  if (isError) {
    return (
      <PageError
        error={error}
        onRetry={() => {
          void refetch();
        }}
        secondaryAction={
          <Button startIcon={<ArrowBackIcon />} onClick={backToList}>
            Back to customers
          </Button>
        }
      />
    );
  }

  const addressLines = [
    customer.address,
    [customer.city, customer.state, customer.postal_code]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(', '),
    customer.country,
  ]
    .map((line) => line?.trim())
    .filter((line): line is string => Boolean(line));

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={backToList}
          sx={{ mb: 1, ml: -1 }}
        >
          Customers
        </Button>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { sm: 'center' },
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Typography variant="h5" component="h1">
              {customerFullName(customer)}
            </Typography>
            <CustomerStatusChip status={customer.status} />
            {customer.is_vip ? <VipBadge /> : null}
          </Stack>

          <Stack direction="row" spacing={1}>
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

            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {
                void navigate(
                  `${appRoutes.customers}/${customer.id}/edit`,
                );
              }}
            >
              Edit
            </Button>

            {/* Mirrors the backend's admin-only delete rule. */}
            {isAdmin ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  setIsDeleteOpen(true);
                }}
              >
                Delete
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      {/* RC2.4D: Profile / Payments. Tab state is local rather than in
          the URL — this is a view toggle within one record, not a
          separate destination, and the record's own URL is what people
          share. */}
      <Tabs
        value={activeTab}
        onChange={(_event, next: TabValue) => {
          setActiveTab(next);
        }}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Profile" value="profile" />
        <Tab label="Payments" value="payments" />
      </Tabs>

      {activeTab === 'payments' ? (
        <CustomerPaymentsTab
          customerId={customer.id}
          customerName={customerFullName(customer)}
        />
      ) : (
      <Stack spacing={3}>
        {/* RC2.7: payment figures at the top of the profile. Outstanding
            Balance is "Not tracked" (this CRM records payments, not
            amounts owed); the other two come from the backend summary. */}
        <CustomerProfileSummary
          summary={paymentData?.summary ?? null}
          isLoading={isSummaryPending}
        />

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            alignItems: 'start',
          }}
        >
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Contact details
            </Typography>
            <Stack spacing={2}>
              <Field label="Email" value={customer.email} />
              <Field label="Phone" value={customer.phone} />
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Company
            </Typography>
            <Stack spacing={2}>
              <Field label="Company name" value={customer.company_name} />
              <Field label="Lead source" value={customer.lead_source} />
              <Field label="Assigned agent" value={customer.assigned_agent} />
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Address
            </Typography>
            {addressLines.length > 0 ? (
              <Stack spacing={0.5}>
                {addressLines.map((line) => (
                  <Typography key={line} variant="body1">
                    {line}
                  </Typography>
                ))}
              </Stack>
            ) : (
              <Typography variant="body1" color="text.disabled">
                Not recorded
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Notes
            </Typography>
            {customer.notes?.trim() ? (
              // Preserves the line breaks the author typed; without this
              // a multi-paragraph note collapses into one run-on block.
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {customer.notes}
              </Typography>
            ) : (
              <Typography variant="body1" color="text.disabled">
                No notes recorded
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Field
              label="Created"
              value={new Date(customer.created_at).toLocaleString()}
            />
          </CardContent>
        </Card>
        </Box>
      </Stack>
      )}

      <DeleteCustomerDialog
        open={isDeleteOpen}
        customerName={customerFullName(customer)}
        isDeleting={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
        onCancel={() => {
          setIsDeleteOpen(false);
          deleteMutation.reset();
        }}
        onConfirm={() => {
          deleteMutation.mutate(customer.id, {
            // Only navigate once the server has confirmed. Leaving early
            // would send the user back to a list that still shows the
            // record if the delete turned out to fail.
            onSuccess: () => {
              setIsDeleteOpen(false);
              backToList();
            },
          });
        }}
      />

      {/* Quick Record Payment — same dialog and mutation the Payments tab
          uses, so the profile summary and history refresh on success via
          the shared query invalidation. */}
      <RecordPaymentDialog
        open={isRecordOpen}
        customerName={customerFullName(customer)}
        isSaving={createMutation.isPending}
        submitError={createMutation.error?.message ?? null}
        onCancel={() => {
          setIsRecordOpen(false);
          createMutation.reset();
        }}
        onSubmit={handleRecord}
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
