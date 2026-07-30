import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardOutlined';
import DownloadIcon from '@mui/icons-material/FileDownloadOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import RestartIcon from '@mui/icons-material/RestartAltOutlined';

import { NotificationSnackbar } from '../../../components/feedback/NotificationSnackbar';
import { ApiError } from '../../../lib/api/types';
import { importApi } from '../api/importApi';
import { useUploadImport, useCommitImport } from '../hooks/useImportMutations';
import { ImportSummaryCards } from '../components/ImportSummaryCards';
import { ImportErrorsTable } from '../components/ImportErrorsTable';
import { ImportActionChooser } from '../components/ImportActionChooser';
import { ImportResultCards } from '../components/ImportResultCards';
import type { ImportAction, ImportPreview, ImportResult } from '../types';

const STEPS = ['Template', 'Upload', 'Preview', 'Choose Action', 'Result'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = ['.xlsx', '.csv'];

const COMMISSION_NOTICE =
  'Historical imported payments are excluded from agent commission. Only new CRM payments generate commission.';

function validateFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!ACCEPTED.some((ext) => name.endsWith(ext))) {
    return 'Unsupported file type. Please choose a .xlsx or .csv file.';
  }
  if (file.size > MAX_BYTES) {
    return 'File is too large. The maximum size is 5 MB.';
  }
  return null;
}

export function ImportWizardPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [action, setAction] = useState<ImportAction | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [errorsBusy, setErrorsBusy] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const uploadMutation = useUploadImport();
  const commitMutation = useCommitImport(preview?.importId ?? '');

  const reset = (): void => {
    setActiveStep(0);
    setFile(null);
    setFileError(null);
    setPreview(null);
    setAction(null);
    setResult(null);
    uploadMutation.reset();
    commitMutation.reset();
  };

  const handleDownloadTemplate = async (): Promise<void> => {
    setTemplateBusy(true);
    try {
      await importApi.downloadTemplate();
    } catch (error) {
      setNotification(
        error instanceof ApiError
          ? error.message
          : 'Could not download the template.',
      );
    } finally {
      setTemplateBusy(false);
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const selected = event.target.files?.[0] ?? null;
    // Reset the input so re-selecting the same file still fires onChange.
    event.target.value = '';
    if (!selected) return;
    const problem = validateFile(selected);
    if (problem) {
      setFile(null);
      setFileError(problem);
      return;
    }
    setFile(selected);
    setFileError(null);
    uploadMutation.reset();
  };

  const handleUpload = (): void => {
    if (!file) return;
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        setPreview(data);
        setActiveStep(2);
      },
    });
  };

  const handleCommit = (): void => {
    if (!action) return;
    commitMutation.mutate(action, {
      onSuccess: (data) => {
        setResult(data);
        setActiveStep(4);
      },
    });
  };

  const handleDownloadErrors = async (): Promise<void> => {
    if (!preview) return;
    setErrorsBusy(true);
    try {
      await importApi.downloadErrors(preview.importId);
    } catch (error) {
      setNotification(
        error instanceof ApiError
          ? error.message
          : 'Could not download the error report.',
      );
    } finally {
      setErrorsBusy(false);
    }
  };

  const hasRowErrors = (preview?.rowErrors.length ?? 0) > 0;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h1">
          Import Customers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bulk-import customers and their historical payments from Excel or CSV.
        </Typography>
      </Box>

      <Alert severity="info" icon={false}>
        {COMMISSION_NOTICE}
      </Alert>

      <Stepper activeStep={activeStep} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent>
          {/* STEP 1 — DOWNLOAD TEMPLATE */}
          {activeStep === 0 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Step 1 — Download the template
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start from the official template so every column maps correctly.
                Fill in your customers (one per row) and, optionally, one
                historical payment per row. Assigned Agent accepts the agent&apos;s
                name or email.
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={
                    templateBusy ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <DownloadIcon />
                    )
                  }
                  disabled={templateBusy}
                  onClick={() => {
                    void handleDownloadTemplate();
                  }}
                >
                  Download Excel Template
                </Button>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => {
                    setActiveStep(1);
                  }}
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          )}

          {/* STEP 2 — UPLOAD */}
          {activeStep === 1 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Step 2 — Upload your file
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accepted formats: .xlsx and .csv. Maximum size 5&nbsp;MB.
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ alignItems: { sm: 'center' } }}
              >
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                  Choose File
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.csv"
                    onChange={handleFileSelect}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {file ? file.name : 'No file selected'}
                </Typography>
              </Stack>

              {fileError && <Alert severity="error">{fileError}</Alert>}
              {uploadMutation.isError && uploadMutation.error && (
                <Alert severity="error">{uploadMutation.error.message}</Alert>
              )}

              <Divider />
              <Stack direction="row" spacing={1.5}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => {
                    setActiveStep(0);
                  }}
                  disabled={uploadMutation.isPending}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  disabled={!file || uploadMutation.isPending}
                  startIcon={
                    uploadMutation.isPending ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : null
                  }
                  onClick={handleUpload}
                >
                  {uploadMutation.isPending ? 'Uploading…' : 'Upload & Preview'}
                </Button>
              </Stack>
            </Stack>
          )}

          {/* STEP 3 — PREVIEW */}
          {activeStep === 2 && preview && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Step 3 — Review the preview
              </Typography>

              <ImportSummaryCards summary={preview.summary} />

              {hasRowErrors ? (
                <>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="subtitle2">
                      Rows needing attention
                    </Typography>
                    <Button
                      size="small"
                      startIcon={
                        errorsBusy ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <DownloadIcon />
                        )
                      }
                      disabled={errorsBusy}
                      onClick={() => {
                        void handleDownloadErrors();
                      }}
                    >
                      Download Error Report
                    </Button>
                  </Stack>
                  <ImportErrorsTable rows={preview.rowErrors} />
                </>
              ) : (
                <Alert severity="success">
                  All rows are valid and ready to import.
                </Alert>
              )}

              <Divider />
              <Stack direction="row" spacing={1.5}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => {
                    setActiveStep(1);
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  disabled={preview.summary.valid === 0}
                  onClick={() => {
                    setActiveStep(3);
                  }}
                >
                  Choose Action
                </Button>
              </Stack>
              {preview.summary.valid === 0 && (
                <Typography variant="caption" color="text.secondary">
                  There are no valid rows to import. Fix the file and re-upload.
                </Typography>
              )}
            </Stack>
          )}

          {/* STEP 4 — CHOOSE ACTION */}
          {activeStep === 3 && preview && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Step 4 — Choose what to do with existing customers
              </Typography>

              <ImportActionChooser
                value={action}
                onChange={setAction}
                disabled={commitMutation.isPending}
              />

              <Alert severity="info" icon={false}>
                {COMMISSION_NOTICE}
              </Alert>

              {commitMutation.isError && commitMutation.error && (
                <Alert severity="error">{commitMutation.error.message}</Alert>
              )}

              <Divider />
              <Stack direction="row" spacing={1.5}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => {
                    setActiveStep(2);
                  }}
                  disabled={commitMutation.isPending}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  disabled={!action || commitMutation.isPending}
                  startIcon={
                    commitMutation.isPending ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : null
                  }
                  onClick={handleCommit}
                >
                  {commitMutation.isPending ? 'Importing…' : 'Run Import'}
                </Button>
              </Stack>
            </Stack>
          )}

          {/* STEP 5 — RESULT */}
          {activeStep === 4 && result && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Step 5 — Import complete
              </Typography>
              <Alert severity="success">
                The import finished successfully.
              </Alert>

              <ImportResultCards result={result} />

              <Divider />
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                {(result.failedCount > 0 || hasRowErrors) && (
                  <Button
                    variant="outlined"
                    startIcon={
                      errorsBusy ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <DownloadIcon />
                      )
                    }
                    disabled={errorsBusy}
                    onClick={() => {
                      void handleDownloadErrors();
                    }}
                  >
                    Download Error Report
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<RestartIcon />}
                  onClick={reset}
                >
                  Import Another File
                </Button>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>

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
