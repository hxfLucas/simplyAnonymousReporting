import api from './axios';

export interface DashboardStats {
  totalCountUsers: number;
  totalCountReportsNew: number;
  totalCountReportsInReview: number;
  totalCountReportsResolved: number;
  totalCountReportsRejected: number;
  totalMagicLinksGenerated: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/fetch');
  return data;
}
