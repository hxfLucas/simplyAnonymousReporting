import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import KpiIcon from './KpiIcon';
import styles from './KpiCard.module.css';

type KpiCardProps = {
  title: string;
  value: string | number;
  delta?: number;
  iconName: string;
};

const KpiCard: React.FC<KpiCardProps> = ({ title, value, delta, iconName }) => {
  const hasDelta = typeof delta === 'number';
  const deltaIsPositive = hasDelta && (delta as number) > 0;
  const deltaText = hasDelta ? `${deltaIsPositive ? '+' : ''}${delta}%` : null;

  return (
    <Card variant="outlined" className={styles.card}>
      <CardContent className={styles.content}>
        <Box className={styles.header}>
          <KpiIcon iconName={iconName} alt={`${title} icon`} />
          <Typography variant="subtitle2" color="textSecondary">
            {title}
          </Typography>
        </Box>

        <Typography variant="h5" component="div" className={styles.value}>
          {value}
        </Typography>

        {deltaText && (
          <Typography variant="caption" sx={{ color: deltaIsPositive ? 'success.main' : 'error.main' }}>
            {deltaIsPositive ? '▲' : '▼'} {deltaText}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;
