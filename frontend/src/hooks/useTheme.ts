import { useThemeContext } from '../contexts/ThemeContext';

// This hook is simply an alias for the context accessor so consumers don't
// have to know which file exports it.
export default function useTheme() {
  return useThemeContext();
}