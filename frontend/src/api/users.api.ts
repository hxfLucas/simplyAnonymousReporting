import api from './axios';

export type UserRole = 'admin' | 'manager';
export type User = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};
export type AddUserPayload = { email: string;  password: string };
export type PaginatedResponse<T> = { data: T[]; total: number; hasMore: boolean; };

export async function listUsers(offset = 0, limit = 25, search?: string): Promise<PaginatedResponse<User>> {
  const { data } = await api.get<PaginatedResponse<User>>('/users/list', {
    params: { offset, limit, ...(search && { search }) },
  });
  return data;
}

export async function addUser(payload: AddUserPayload): Promise<User> {
  const { data } = await api.post<User>('/users/add-user', payload);
  return data;
}

export async function removeUser(id: string): Promise<void> {
  await api.delete(`/users/remove-user/${id}`);
}

export async function updateUserPassword(id: string, password: string): Promise<void> {
  await api.patch('/users/update-user', { id, password });
}

export async function changeOwnPassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.put('/users/settings', { action: 'change_password', ...payload });
}

export async function signOutAllDevices(): Promise<void> {
  await api.put('/users/settings', { action: 'sign_out_all_devices' });
}
