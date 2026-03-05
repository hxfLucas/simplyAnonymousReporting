import React from 'react';
import styles from './KpiCard.module.css';

type Props = {
  iconName: string;
  alt?: string;
  size?: number;
};

const KpiIcon: React.FC<Props> = ({ iconName, alt, size = 36 }) => {
  const src = `/src/assets/icons/${iconName}.svg`;
  return <img src={src} alt={alt ?? iconName} className={styles.icon} width={size} height={size} />;
};

export default KpiIcon;
