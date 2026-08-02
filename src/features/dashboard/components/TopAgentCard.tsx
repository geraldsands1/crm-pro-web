import { Box, Card, CardContent, Typography } from '@mui/material';

import { formatCurrency, formatNumber } from '../../../lib/format';
import type { TopAgent } from '../types';

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" noWrap>
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
        {value}
      </Typography>
    </Box>
  );
}

/** The headline "Top Performing Agent" card. */
export function TopAgentCard({ agent }: { agent: TopAgent }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          Top Performing Agent
        </Typography>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          {agent.agentName}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          }}
        >
          <Figure label="Total Sales" value={formatCurrency(agent.totalSales)} />
          <Figure label="This Month" value={formatCurrency(agent.thisMonthSales)} />
          <Figure
            label="Total Commission"
            value={formatCurrency(agent.totalCommission)}
          />
          <Figure label="Customers" value={formatNumber(agent.customerCount)} />
        </Box>
      </CardContent>
    </Card>
  );
}
