import IconButton from '@mui/material/IconButton';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import useTheme from '../hooks/useTheme';

export default function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  return (
    <IconButton
      size="small"
      color="inherit"
      aria-label="Toggle light/dark mode"
      onClick={toggleMode}
    >
      {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
    </IconButton>
  );
}
