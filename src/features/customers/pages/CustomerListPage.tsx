import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

import { DataTable } from '../../../components/data/DataTable';
import type { DataTableColumn } from '../../../components/data/DataTable';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { PageError } from '../../../components/feedback/PageError';
import { appRoutes } from '../../../app/router/routes';
import { useAuth } from '../../auth/hooks/useAuth';
import { CustomerStatusChip } from '../components/CustomerStatusChip';
import { DeleteCustomerDialog } from '../components/DeleteCustomerDialog';
import { VipBadge } from '../components/VipBadge';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  PAGE_SIZE_OPTIONS,
  SEARCH_DEBOUNCE_MS,
} from '../constants';
import { useCustomerList } from '../hooks/useCustomerList';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useDeleteCustomer } from '../hooks/useCustomerMutations';
import { orDash } from '../../../lib/format';
import { customerFullName } from '../utils/sortCustomers';
import type { Customer, CustomerSort, CustomerSortField } from '../types';

const SORTABLE_FIELDS: readonly string[] = ['name', 'company', 'status'];

function isSortField(value: string): value is CustomerSortField {
  return SORTABLE_FIELDS.includes(value);
}

/** Renders a value that may be null, without leaving an empty cell. */
export function CustomerListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<CustomerSort>(DEFAULT_SORT);
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);

  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );

  // A new search term restarts at page one. Without this, searching while
  // on page 4 asks the server for page 4 of a much smaller result set and
  // shows an empty table for a query that plainly has matches.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const deleteMutation = useDeleteCustomer();

  const {
    customers,
    total,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
    isSortScopedToPage,
  } = useCustomerList({
    search: debouncedSearch,
    page,
    pageSize,
    sort,
  });

  const handleSort = (field: string): void => {
    if (!isSortField(field)) return;

    setSort((current) =>
      current.field === field
        ? {
            field,
            direction: current.direction === 'asc' ? 'desc' : 'asc',
          }
        : { field, direction: 'asc' },
    );
  };

  const openCustomer = (customer: Customer): void => {
    void navigate(`${appRoutes.customers}/${customer.id}`);
  };

  const confirmDelete = (): void => {
    if (!pendingDelete) return;

    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        setPendingDelete(null);
      },
    });
  };

  const columns = useMemo<readonly DataTableColumn<Customer>[]>(
    () => [
      {
        id: 'name',
        label: 'Customer Name',
        sortField: 'name',
        render: (customer) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {customerFullName(customer)}
          </Typography>
        ),
      },
      {
        id: 'company',
        label: 'Company',
        sortField: 'company',
        hideBelow: 'md',
        render: (customer) => orDash(customer.company_name),
      },
      {
        id: 'phone',
        label: 'Phone',
        hideBelow: 'md',
        render: (customer) => orDash(customer.phone),
      },
      {
        id: 'city',
        label: 'City',
        hideBelow: 'lg',
        render: (customer) => orDash(customer.city),
      },
      {
        id: 'status',
        label: 'Status',
        sortField: 'status',
        render: (customer) => <CustomerStatusChip status={customer.status} />,
      },
      {
        id: 'vip',
        label: 'VIP',
        align: 'center',
        render: (customer) => (customer.is_vip ? <VipBadge /> : '—'),
      },
      {
        id: 'agent',
        label: 'Assigned Agent',
        hideBelow: 'lg',
        render: (customer) => orDash(customer.assigned_agent),
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        width: 120,
        render: (customer) => (
          // stopPropagation everywhere: the row itself navigates to the
          // details page, and without it every action click would also
          // open that page underneath the action.
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ justifyContent: 'flex-end' }}
          >
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  void navigate(
                    `${appRoutes.customers}/${customer.id}/edit`,
                  );
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Admin-only, matching the backend's own rule on
                DELETE /customers/:id. Hiding it is a convenience, not the
                control — the server rejects an agent's delete regardless
                of what this renders. */}
            {isAdmin ? (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDelete(customer);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
    ],
    [isAdmin, navigate],
  );

  const isSearching = debouncedSearch.length > 0;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Typography variant="h5" component="h1">
            Customers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isSearching
              ? `${total} result${total === 1 ? '' : 's'} for “${debouncedSearch}”`
              : `${total} customer${total === 1 ? '' : 's'}`}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            void navigate(appRoutes.customerNew);
          }}
        >
          Add Customer
        </Button>
      </Stack>

      <TextField
        value={searchInput}
        onChange={(event) => {
          setSearchInput(event.target.value);
        }}
        placeholder="Search name, company, email, phone or postal code"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchInput('');
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />

      {isError && error ? (
        <PageError error={error} onRetry={refetch} />
      ) : (
        <Box>
          {/* A thin bar rather than replacing the table: on a refetch the
              current rows stay readable instead of collapsing to a
              skeleton on every keystroke. */}
          <Box sx={{ height: 4 }}>
            {isFetching && !isPending ? <LinearProgress /> : null}
          </Box>

          {isSortScopedToPage && !isPending ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              Search results are ordered within the current page.
            </Typography>
          ) : null}

          <DataTable<Customer>
            columns={columns}
            rows={customers}
            getRowKey={(customer) => customer.id}
            isLoading={isPending}
            onRowClick={openCustomer}
            sortField={sort.field}
            sortDirection={sort.direction}
            onSort={handleSort}
            emptyState={
              isSearching ? (
                <EmptyState
                  title="No matching customers"
                  description={`Nothing matched “${debouncedSearch}”. Try a different name, company, email or phone number.`}
                  action={
                    <Button
                      onClick={() => {
                        setSearchInput('');
                      }}
                    >
                      Clear search
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  title="No customers yet"
                  description="Add your first customer to get started."
                  action={
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        void navigate(appRoutes.customerNew);
                      }}
                    >
                      Add Customer
                    </Button>
                  }
                />
              )
            }
          />

          <TablePagination
            component="div"
            count={total}
            // MUI counts pages from zero; the API counts from one.
            page={Math.max(page - 1, 0)}
            onPageChange={(_event, nextPage) => {
              setPage(nextPage + 1);
            }}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
            onRowsPerPageChange={(event) => {
              setPageSize(Number(event.target.value));
            }}
          />
        </Box>
      )}

      <DeleteCustomerDialog
        open={pendingDelete !== null}
        customerName={pendingDelete ? customerFullName(pendingDelete) : ''}
        isDeleting={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
        onCancel={() => {
          setPendingDelete(null);
          deleteMutation.reset();
        }}
        onConfirm={confirmDelete}
      />
    </Stack>
  );
}
