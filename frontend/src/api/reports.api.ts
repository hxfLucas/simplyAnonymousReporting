import api from './axios';

export type ReportStatus = 'new' | 'in_review' | 'resolved' | 'rejected';
export type Report = {
  id: string;
  companyId: string;
  title: string;
  description: string;
  isAnonymous: boolean;
  reporterEmail: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
};

// TODO: confirm endpoint with backend team
export async function getReports(): Promise<Report[]> {
  const { data } = await api.get<Report[]>('/reports');
  return data;
}
