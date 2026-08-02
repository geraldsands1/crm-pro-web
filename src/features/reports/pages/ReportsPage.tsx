import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/FileDownloadOutlined';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import CommissionIcon from '@mui/icons-material/PaidOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

import { NotificationSnackbar } from '../../../components/feedback/NotificationSnackbar';
import { ApiError } from '../../../lib/api/types';
import { reportsApi } from '../api/reportsApi';

interface ReportCard {
  key: string;
  title: string;
  description: string;
  icon: SvgIconComponent;
  download: () => Promise<void>;
}

const REPORTS: readonly ReportCard[] = [
  {
    key: 'customers',
    title: 'Export Customers',
    description:
      'All customers with contact details, assigned agent, and total paid.',
    icon: PeopleIcon,
    download: () => reportsApi.exportCustomers(),
  },
  {
    key: 'payments',
    title: 'Export Payments',
    description: 'Every payment (CRM and imported) with method and source.',
    icon: PaymentsIcon,
    download: () => reportsApi.exportPayments(),
  },
  {
    key: 'agents',
    title: 'Export Agent Performance',
    description: 'Per-agent sales and commission, active and inactive agents.',
    icon: BadgeIcon,
    download: () => reportsApi.exportAgents(),
  },
  {
    key: 'commissions',
    title: 'Export Commission Ledger',
    description: 'The full commission ledger with status and payout dates.',
    icon: CommissionIcon,
    download: () => reportsApi.exportCommissions(),
  },
];

export function ReportsPage() {
  // Which report is currently downloading (only one button spins at a time
  // for that report; others stay usable).
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (report: ReportCard): Promise<void> => {
    setBusyKey(report.key);
    setError(null);
    try {
      await report.download();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Could not generate the report. Please try again.';
      setError(message);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h1">
          Reports &amp; Exports
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Download CRM data as Excel (.xlsx) files.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        {REPORTS.map((report) => {
          const Icon = report.icon;
          const isBusy = busyKey === report.key;
          return (
            <Card key={report.key} sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2} sx={{ height: '100%' }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: 'center' }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        flexShrink: 0,
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {report.title}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {report.description}
                  </Typography>

                  <Box sx={{ mt: 'auto' }}>
                    <Button
                      variant="contained"
                      startIcon={
                        isBusy ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <DownloadIcon />
                        )
                      }
                      disabled={isBusy}
                      onClick={() => {
                        void run(report);
                      }}
                    >
                      {isBusy ? 'Preparing…' : 'Download Excel'}
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <NotificationSnackbar
        open={error !== null}
        message={error ?? ''}
        severity="error"
        onClose={() => setError(null)}
      />
    </Stack>
  );
}
