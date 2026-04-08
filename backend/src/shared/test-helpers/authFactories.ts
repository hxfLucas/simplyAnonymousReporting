import type { AuthenticatedUser } from '../auth/authContext';

export function makeAdminAuth(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: 'admin-user-id',
    role: 'admin',
    companyId: 'company-id',
    ...overrides,
  };
}

export function makeManagerAuth(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: 'manager-user-id',
    role: 'manager',
    companyId: 'company-id',
    ...overrides,
  };
}
