import api from './axios';

export type PaginatedResponse<T> = { data: T[]; total: number; hasMore: boolean; };

export type MagicLink = {
  id: string;
  reportingToken: string;
  company: { id: string };
  createdAt: string;
  alias: string | null;
  createdById: string | null;
  createdBy: { id: string; email: string } | null;
};

export async function listMagicLinks(offset = 0, limit = 25): Promise<PaginatedResponse<MagicLink>> {
  const { data } = await api.get<PaginatedResponse<MagicLink>>('/magiclinks/list', {
    params: { offset, limit },
  });
  return data;
}

export async function createMagicLink(alias?: string): Promise<MagicLink> {
  const { data } = await api.post<MagicLink>('/magiclinks/create-new-magiclink', { alias });
  return data;
}

export async function deleteMagicLink(id: string): Promise<void> {
  await api.delete(`/magiclinks/delete-magiclink/${id}`);
}
