import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { useDashboard } from '../../../hooks/modules/useDashboard';

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          {value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { stats, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!stats) return null;

  const cards: StatCardProps[] = [
    { label: 'Total Users', value: stats.totalCountUsers },
    { label: 'New Reports', value: stats.totalCountReportsNew },
    { label: 'In-Review Reports', value: stats.totalCountReportsInReview },
    { label: 'Resolved Reports', value: stats.totalCountReportsResolved },
    { label: 'Rejected Reports', value: stats.totalCountReportsRejected },
    { label: 'Magic Links Generated', value: stats.totalMagicLinksGenerated },
  ];

  return (
    <Box p={4}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.label}>
            <StatCard label={card.label} value={card.value} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
