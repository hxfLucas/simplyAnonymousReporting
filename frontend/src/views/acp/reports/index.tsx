import { useEffect } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useReports } from '../../../hooks/modules/useReports';

export default function ReportsPage() {
  const { reports, isLoading, error, fetchReports, STATUS_LABELS, STATUS_COLORS } = useReports();

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Reports
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!error && !isLoading && reports.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={6}>
          No reports found.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Anonymous</TableCell>
                <TableCell>Reporter Email</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[report.status] ?? report.status}
                      size="small"
                      sx={{
                        bgcolor: STATUS_COLORS[report.status] ?? undefined,
                        color: '#fff',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>{report.anonymous ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{report.reporterEmail ?? '—'}</TableCell>
                  <TableCell>
                    {report.createdAt
                      ? new Date(report.createdAt).toLocaleDateString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
