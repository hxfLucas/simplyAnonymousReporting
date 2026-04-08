import api from './axios';

export type ReportStatus = 'new' | 'in_review' | 'resolved' | 'rejected';
export type PaginatedResponse<T> = { data: T[]; total: number; hasMore: boolean; };

export type Report = {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
};

export type ValidateReportResponse = {
  companyId: string;
  companyName: string;
};

export async function getReports(offset = 0, limit = 25): Promise<PaginatedResponse<Report>> {
  const { data } = await api.get<PaginatedResponse<Report>>('/reports/list', {
    params: { offset, limit },
  });
  return data;
}

export async function validateReport(token: string): Promise<ValidateReportResponse> {
  const { data } = await api.get<ValidateReportResponse>(`/reports/validate-report`, {
    params: { token },
  });
  return data;
}

export async function submitReport(payload: {
  token: string;
  title: string;
  description: string;
}): Promise<Report> {
  const { data } = await api.post<Report>('/reports/submit-report', payload);
  return data;
}

export async function deleteReport(id: string): Promise<void> {
  await api.delete(`/reports/delete-report/${id}`);
}

export async function updateReportStatus(payload: {
  id: string;
  status: ReportStatus;
}): Promise<Report> {
  const { data } = await api.patch<Report>('/reports/update-report-status', payload);
  return data;
}
