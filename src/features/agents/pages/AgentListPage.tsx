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
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { EmptyState } from '../../../components/feedback/EmptyState';
import { PageError } from '../../../components/feedback/PageError';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { appRoutes } from '../../../app/router/routes';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { clampPage, paginate } from '../../../lib/collection/paginate';
import { AgentTable } from '../components/AgentTable';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  PAGE_SIZE_OPTIONS,
  SEARCH_DEBOUNCE_MS,
} from '../constants';
import { useAgents } from '../hooks/useAgents';
import {
  useDeleteAgent,
  useSetAgentActive,
} from '../hooks/useAgentMutations';
import { filterAgents, sortAgents } from '../utils/filterAgents';
import type { Agent, AgentSort, AgentSortField } from '../types';

const SORTABLE_FIELDS: readonly string[] = ['name', 'email', 'status', 'created'];

function isSortField(value: string): value is AgentSortField {
  return SORTABLE_FIELDS.includes(value);
}

export function AgentListPage() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<AgentSort>(DEFAULT_SORT);
  const [pendingDelete, setPendingDelete] = useState<Agent | null>(null);

  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );

  const { data, isPending, isFetching, isError, error, refetch } = useAgents();

  const toggleMutation = useSetAgentActive();
  const deleteMutation = useDeleteAgent();

  // `GET /agents` returns the whole collection with no query parameters,
  // so search, sort and pagination are all applied here over the single
  // cached response. Filtering before sorting keeps the ordering applied
  // to what is actually shown, not to rows that were filtered out.
  const filtered = useMemo(
    () => sortAgents(filterAgents(data ?? [], debouncedSearch), sort),
    [data, debouncedSearch, sort],
  );

  const total = filtered.length;
  // Guards the page vanishing underneath the user — deleting the last row
  // on a page, or narrowing the search — which would otherwise show an
  // empty table that reads as a failure.
  const safePage = clampPage(page, total, pageSize);
  const rows = useMemo(
    () => paginate(filtered, safePage, pageSize),
    [filtered, safePage, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const handleSort = (field: string): void => {
    if (!isSortField(field)) return;

    setSort((current) =>
      current.field === field
        ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    );
  };

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
            Agents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isSearching
              ? `${total} result${total === 1 ? '' : 's'} for “${debouncedSearch}”`
              : `${total} agent${total === 1 ? '' : 's'}`}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            void navigate(appRoutes.agentNew);
          }}
        >
          Add Agent
        </Button>
      </Stack>

      <TextField
        value={searchInput}
        onChange={(event) => {
          setSearchInput(event.target.value);
        }}
        placeholder="Search name, email or phone"
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
        <PageError
          error={error}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : (
        <Box>
          <Box sx={{ height: 4 }}>
            {isFetching && !isPending ? <LinearProgress /> : null}
          </Box>

          {/* A failed toggle has no dialog of its own to report into, so
              it surfaces here rather than disappearing silently. */}
          {toggleMutation.isError ? (
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              {toggleMutation.error.message}
            </Typography>
          ) : null}

          <AgentTable
            agents={rows}
            isLoading={isPending}
            sort={sort}
            onSort={handleSort}
            togglingId={
              toggleMutation.isPending
                ? (toggleMutation.variables?.id ?? null)
                : null
            }
            canDelete
            onEdit={(agent) => {
              void navigate(`${appRoutes.agents}/${agent.id}/edit`);
            }}
            onToggleActive={(agent) => {
              toggleMutation.mutate({
                id: agent.id,
                isActive: !agent.is_active,
              });
            }}
            onDelete={(agent) => {
              setPendingDelete(agent);
            }}
            emptyState={
              isSearching ? (
                <EmptyState
                  title="No matching agents"
                  description={`Nothing matched “${debouncedSearch}”.`}
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
                  title="No agents yet"
                  description="Create an agent account to give someone access to the CRM."
                  action={
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        void navigate(appRoutes.agentNew);
                      }}
                    >
                      Add Agent
                    </Button>
                  }
                />
              )
            }
          />

          <TablePagination
            component="div"
            count={total}
            page={Math.max(safePage - 1, 0)}
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

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this agent?"
        description={
          <>
            <strong>{pendingDelete?.full_name}</strong> will be permanently
            deleted and will lose access immediately. Customers assigned to
            them stay in the CRM but become unassigned. This cannot be undone.
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
            },
          });
        }}
      />
    </Stack>
  );
}
