import { useState } from 'react';
import {
  Autocomplete,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';

import { PaymentForm } from './PaymentForm';
import { emptyPaymentFormValues } from '../schemas/paymentSchema';
import type { PaymentFormOutput } from '../schemas/paymentSchema';
import type { Customer } from '../../customers/types';
import { customerFullName } from '../../customers/utils/sortCustomers';

interface RecordPaymentFromListDialogProps {
  open: boolean;
  customers: readonly Customer[];
  isSaving: boolean;
  submitError?: string | null;
  onCancel: () => void;
  onSubmit: (customerId: string, values: PaymentFormOutput) => Promise<void>;
}

/**
 * Record-payment dialog for the standalone Payments page.
 *
 * Unlike the Customer Details tab — where the customer is already known —
 * this is reached with no customer in context, so it adds a customer
 * picker above the shared [PaymentForm]. The form itself is unchanged and
 * still knows nothing about which customer it belongs to; the id is joined
 * in here at submit time.
 *
 * `keepMounted={false}` unmounts on close, which resets both the picker
 * and the form so reopening starts blank.
 */
export function RecordPaymentFromListDialog({
  open,
  customers,
  isSaving,
  submitError,
  onCancel,
  onSubmit,
}: RecordPaymentFromListDialogProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);

  const handleSubmit = async (values: PaymentFormOutput): Promise<void> => {
    if (!customer) {
      setCustomerError('Select a customer.');
      return;
    }
    setCustomerError(null);
    await onSubmit(customer.id, values);
  };

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      keepMounted={false}
      aria-labelledby="record-payment-list-title"
    >
      <DialogTitle id="record-payment-list-title">Record payment</DialogTitle>

      <DialogContent>
        <Autocomplete
          options={[...customers]}
          value={customer}
          onChange={(_event, value) => {
            setCustomer(value);
            if (value) setCustomerError(null);
          }}
          getOptionLabel={(option) => customerFullName(option)}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          disabled={isSaving}
          sx={{ mt: 1, mb: 1 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Customer"
              required
              error={Boolean(customerError)}
              helperText={customerError ?? ' '}
            />
          )}
        />

        <PaymentForm
          defaultValues={emptyPaymentFormValues()}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          submitLabel="Record Payment"
          submitError={submitError ?? null}
        />
      </DialogContent>
    </Dialog>
  );
}
