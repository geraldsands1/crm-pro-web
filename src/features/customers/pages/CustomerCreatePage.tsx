import { useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';

import { appRoutes } from '../../../app/router/routes';
import { CustomerForm } from '../components/CustomerForm';
import { CUSTOMER_STATUSES } from '../constants';
import { useCreateCustomer } from '../hooks/useCustomerMutations';
import {
  emptyCustomerFormValues,
  toCustomerInput,
} from '../schemas/customerSchema';
import type { CustomerFormOutput } from '../schemas/customerSchema';

export function CustomerCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateCustomer();

  const backToList = (): void => {
    void navigate(appRoutes.customers);
  };

  const handleSubmit = async (values: CustomerFormOutput): Promise<void> => {
    try {
      const created = await createMutation.mutateAsync(toCustomerInput(values));
      // Straight to the new record rather than back to the list: the
      // mutation has already seeded the detail cache, so it renders
      // immediately and confirms exactly what was saved.
      void navigate(`${appRoutes.customers}/${created.id}`, { replace: true });
    } catch {
      // Swallowed on purpose. The mutation already holds the error and
      // it is rendered below; rethrowing would surface an unhandled
      // rejection in the console for a failure that is fully handled.
    }
  };

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
        <Typography variant="h5" component="h1">
          Add Customer
        </Typography>
      </Box>

      <CustomerForm
        defaultValues={emptyCustomerFormValues(CUSTOMER_STATUSES[0])}
        onSubmit={handleSubmit}
        onCancel={backToList}
        submitLabel="Create Customer"
        serverError={createMutation.error ?? null}
      />
    </Stack>
  );
}
