import { useMatch } from 'react-router-dom'

export default function useIsReportsRoute(): boolean {
  const matchAcpReports = useMatch({ path: '/acp/reports', end: true });
  return Boolean(matchAcpReports);
}
