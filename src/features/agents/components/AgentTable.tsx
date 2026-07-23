import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { IconButton, Stack, Switch, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

import { DataTable } from '../../../components/data/DataTable';
import type { DataTableColumn } from '../../../components/data/DataTable';
import { formatDate, formatDateTime } from '../../../lib/format';
import { AgentStatusChip } from './AgentStatusChip';
import type { Agent, AgentSort } from '../types';

interface AgentTableProps {
  agents: readonly Agent[];
  isLoading: boolean;
  emptyState: ReactNode;
  sort: AgentSort;
  onSort: (field: string) => void;
  onEdit: (agent: Agent) => void;
  onToggleActive: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  /** Id currently being toggled, so only that row's switch shows pending. */
  togglingId: string | null;
  /** Delete is admin-only; the list itself is already admin-gated. */
  canDelete: boolean;
}


/**
 * The agent table.
 *
 * A thin column definition over the shared `DataTable` rather than a
 * second table implementation — layout, sorting affordances, skeleton and
 * empty body all come from there, so agents and customers stay visually
 * and behaviourally identical for free.
 */
export function AgentTable({
  agents,
  isLoading,
  emptyState,
  sort,
  onSort,
  onEdit,
  onToggleActive,
  onDelete,
  togglingId,
  canDelete,
}: AgentTableProps) {
  const columns = useMemo<readonly DataTableColumn<Agent>[]>(
    () => [
      {
        id: 'name',
        label: 'Name',
        sortField: 'name',
        render: (agent) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {agent.full_name}
          </Typography>
        ),
      },
      {
        id: 'email',
        label: 'Email',
        sortField: 'email',
        render: (agent) => agent.email,
      },
      {
        id: 'role',
        label: 'Role',
        hideBelow: 'md',
        // Constant by construction: this endpoint selects only users
        // joined to the 'agent' role, so no other value can appear.
        render: () => 'Agent',
      },
      {
        id: 'status',
        label: 'Status',
        sortField: 'status',
        render: (agent) => <AgentStatusChip isActive={agent.is_active} />,
      },
      {
        id: 'last_login',
        label: 'Last Login',
        hideBelow: 'lg',
        render: (agent) => formatDateTime(agent.last_login, 'Never'),
      },
      {
        id: 'created_at',
        label: 'Created Date',
        sortField: 'created',
        hideBelow: 'lg',
        render: (agent) => formatDate(agent.created_at),
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        width: 160,
        render: (agent) => (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ justifyContent: 'flex-end', alignItems: 'center' }}
          >
            <Tooltip title={agent.is_active ? 'Deactivate' : 'Activate'}>
              {/* A span wrapper: MUI cannot attach a tooltip to a
                  disabled control, which fires no pointer events. */}
              <span>
                <Switch
                  size="small"
                  checked={agent.is_active}
                  disabled={togglingId === agent.id}
                  onChange={() => {
                    onToggleActive(agent);
                  }}
                  // slotProps, not the removed inputProps — MUI v8
                  // routes per-slot attributes through this one API.
                  slotProps={{
                    input: {
                      'aria-label': agent.is_active
                        ? `Deactivate ${agent.full_name}`
                        : `Activate ${agent.full_name}`,
                    },
                  }}
                />
              </span>
            </Tooltip>

            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => {
                  onEdit(agent);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {canDelete ? (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    onDelete(agent);
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
    [canDelete, onDelete, onEdit, onToggleActive, togglingId],
  );

  return (
    <DataTable<Agent>
      columns={columns}
      rows={agents}
      getRowKey={(agent) => agent.id}
      isLoading={isLoading}
      emptyState={emptyState}
      sortField={sort.field}
      sortDirection={sort.direction}
      onSort={onSort}
    />
  );
}
