import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';

import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { PageError } from '../../../components/feedback/PageError';
import { appRoutes } from '../../../app/router/routes';
import { AgentForm } from '../components/AgentForm';
import { AgentCommissionCards } from '../components/AgentCommissionCards';
import { CommissionHistoryTable } from '../components/CommissionHistoryTable';
import { PendingPayoutCards } from '../components/PendingPayoutCards';
import { useAgents } from '../hooks/useAgents';
import { useAgentCommission } from '../hooks/useAgentCommission';
import { useUpdateAgent } from '../hooks/useAgentMutations';
import {
  agentToFormValues,
  toUpdateAgentInput,
} from '../schemas/agentSchema';
import type { AgentFormOutput } from '../schemas/agentSchema';

function EditSkeleton() {
  return (
    <Stack spacing={3}>
      <Skeleton variant="text" width={240} height={44} />
      {Array.from({ length: 2 }, (_, index) => (
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

export function AgentEditPage() {
  const { agentId = '' } = useParams<{ agentId: string }>();
  const navigate = useNavigate();

  // There is no `GET /agents/:id` endpoint, so the agent is taken from
  // the cached collection the list already loaded. Reusing the same query
  // key means arriving here directly (a refresh, a pasted URL) fetches it
  // once and every later visit is instant.
  const { data: agents, isPending, isError, error, refetch } = useAgents();
  const updateMutation = useUpdateAgent(agentId);
  // RC2.8: server-computed commission stats for this agent (admin view).
  const commissionQuery = useAgentCommission(agentId);

  // RC2.8: holds a pending save while the admin confirms a commission-rate
  // change. Null when no confirmation is in flight.
  const [pendingValues, setPendingValues] = useState<AgentFormOutput | null>(
    null,
  );

  const backToList = (): void => {
    void navigate(appRoutes.agents);
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
          <Button startIcon={<ArrowBackIcon />} onClick={backToList}>
            Back to agents
          </Button>
        }
      />
    );
  }

  const agent = agents.find((candidate) => candidate.id === agentId);

  if (!agent) {
    return (
      <Card>
        <CardContent sx={{ py: 6 }}>
          <EmptyState
            title="Agent not found"
            description="This agent may have been deleted."
            action={
              <Button
                variant="contained"
                startIcon={<ArrowBackIcon />}
                onClick={backToList}
              >
                Back to agents
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (values: AgentFormOutput): Promise<void> => {
    // A commission-rate change is confirmed first — it never rewrites the
    // frozen commission on existing payments, only what future payments
    // use, and the dialog says so. Everything else saves directly.
    if (values.commission_percentage !== agent.commission_percentage) {
      updateMutation.reset();
      setPendingValues(values);
      return;
    }

    try {
      await updateMutation.mutateAsync(toUpdateAgentInput(values));
      backToList();
    } catch {
      // Handled — see AgentCreatePage's matching note.
    }
  };

  const confirmCommissionChange = (): void => {
    if (!pendingValues) return;

    updateMutation.mutate(toUpdateAgentInput(pendingValues), {
      // Only leave once the server confirms; on failure the dialog stays
      // open and renders the error.
      onSuccess: () => {
        setPendingValues(null);
        backToList();
      },
    });
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={backToList}
          sx={{ mb: 1, ml: -1 }}
        >
          Agents
        </Button>
        <Typography variant="h5" component="h1">
          Edit Agent
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {agent.email}
        </Typography>
      </Box>

      {/* RC2.8: commission statistics for this agent, above the form the
          admin uses to adjust the rate. */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Commission
        </Typography>
        <AgentCommissionCards
          stats={commissionQuery.data}
          isLoading={commissionQuery.isPending}
          error={commissionQuery.error}
        />
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Pending Payout
        </Typography>
        <PendingPayoutCards
          totalCommission={commissionQuery.data?.total_commission ?? 0}
        />
      </Box>

      {/* The very same component the Create page renders — only the
          starting values, the mode and the submit handler differ. */}
      <AgentForm
        defaultValues={agentToFormValues(agent)}
        onSubmit={handleSubmit}
        onCancel={backToList}
        submitLabel="Save Changes"
        submitError={updateMutation.error?.message ?? null}
      />

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Commission History
        </Typography>
        <CommissionHistoryTable
          history={commissionQuery.data?.history ?? []}
          isLoading={commissionQuery.isPending}
        />
      </Box>

      {/* RC2.8: guard against an accidental commission-rate change. This is
          a rate-forward change only — existing payments keep their frozen
          commission, which the message states explicitly. */}
      <ConfirmDialog
        open={pendingValues !== null}
        title="Change Commission Rate?"
        description={
          <>
            Existing payments will keep their original commission.
            <br />
            <br />
            Only future payments will use the new commission percentage.
            <br />
            <br />
            Do you want to continue?
          </>
        }
        confirmLabel="Update Commission"
        busyLabel="Updating…"
        confirmColor="primary"
        isBusy={updateMutation.isPending}
        error={updateMutation.error?.message ?? null}
        onCancel={() => {
          setPendingValues(null);
          updateMutation.reset();
        }}
        onConfirm={confirmCommissionChange}
      />
    </Stack>
  );
}
