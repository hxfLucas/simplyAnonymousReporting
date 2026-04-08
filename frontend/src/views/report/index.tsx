import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { validateReport, submitReport } from '../../api/reports.api';
import { extractErrorMessage } from '../../utils/extractErrorMessage';

type PageState = 'loading' | 'invalid' | 'form' | 'submitted' | 'rate-limited';

export default function ReportPage() {
  const { reportTokenId } = useParams<{ reportTokenId: string }>();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!reportTokenId) {
      setPageState('invalid');
      return;
    }
    validateReport(reportTokenId)
      .then((res) => {
        setCompanyName(res.companyName);
        setPageState('form');
      })
      .catch(() => {
        setPageState('invalid');
      });
  }, [reportTokenId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTokenId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitReport({ token: reportTokenId, title, description });
      setPageState('submitted');
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setPageState('rate-limited');
      } else {
        setSubmitError(extractErrorMessage(err, 'Failed to submit report. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      {pageState === 'loading' && (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      )}

      {pageState === 'invalid' && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Invalid Link
          </Typography>
          <Typography color="text.secondary">
            This reporting link is invalid or has expired. Please contact the organization for a new
            link.
          </Typography>
        </Paper>
      )}

      {pageState === 'submitted' && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Report Submitted
          </Typography>
          <Typography color="text.secondary">
            Your report has been submitted anonymously. Thank you.
          </Typography>
        </Paper>
      )}

      {pageState === 'rate-limited' && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Slow down a little!
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Your report was <span style={{ color: 'red', fontWeight: 'bold' }}>rejected</span>. You've submitted a report very recently. Please wait a minute before trying again.
          </Typography>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </Paper>
      )}

      {pageState === 'form' && (
        <Paper variant="outlined" sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Submit a Report
          </Typography>
          {companyName && (
            <Typography color="text.secondary" mb={3}>
              Reporting to: <strong>{companyName}</strong>
            </Typography>
          )}

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              placeholder="Brief summary of the issue"
              autoComplete="off"
            />
            <TextField
              label="Report Details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              fullWidth
              multiline
              rows={6}
              placeholder="Describe the issue in detail..."
              autoComplete="off"
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ alignSelf: 'flex-end' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
}
