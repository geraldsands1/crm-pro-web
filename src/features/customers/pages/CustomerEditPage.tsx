import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';

import { PageError } from '../../../components/feedback/PageError';
import { appRoutes } from '../../../app/router/routes';
import { CustomerForm } from '../components/CustomerForm';
import { useCustomer } from '../hooks/useCustomer';
import { useUpdateCustomer } from '../hooks/useCustomerMutations';
import {
  customerToFormValues,
  toCustomerInput,
} from '../schemas/customerSchema';
import type { CustomerFormOutput } from '../schemas/customerSchema';
import { customerFullName } from '../utils/sortCustomers';

function EditSkeleton() {
  return (
    <Stack spacing={3}>
      <Skeleton variant="text" width={240} height={44} />
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index}>
          <CardContent>
            <Stack spacing={2}>
              <Skeleton variant="text" width={160} height={28} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export function CustomerEditPage() {
  const { customerId = '' } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  const { data: customer, isPending, isError, error, refetch } =
    useCustomer(customerId);
  const updateMutation = useUpdateCustomer(customerId);

  const backToDetails = (): void => {
    void navigate(`${appRoutes.customers}/${customerId}`);
  };

  if (isPending) return <EditSkeleton />;

  if (isError) {
    return (
      <PageError
        error={error}
        onRetry={() => {
          void refetch();
        }}
        secondaryAction={
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              void navigate(appRoutes.customers);
            }}
          >
            Back to customers
          </Button>
        }
      />
    );
  }

  const handleSubmit = async (values: CustomerFormOutput): Promise<void> => {
    try {
      await updateMutation.mutateAsync(toCustomerInput(values));
      backToDetails();
    } catch {
      // Handled — see CustomerCreatePage's matching note.
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={backToDetails}
          sx={{ mb: 1, ml: -1 }}
        >
          {customerFullName(customer)}
        </Button>
        <Typography variant="h5" component="h1">
          Edit Customer
        </Typography>
      </Box>

      {/* The very same component the Add page renders — only the starting
          values, the button label and the submit handler differ. */}
      <CustomerForm
        defaultValues={customerToFormValues(customer)}
        onSubmit={handleSubmit}
        onCancel={backToDetails}
        submitLabel="Save Changes"
        serverError={updateMutation.error ?? null}
      />
    </Stack>
  );
}
