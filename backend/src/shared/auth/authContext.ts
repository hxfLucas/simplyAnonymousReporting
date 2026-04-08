import { AsyncLocalStorage } from 'async_hooks';

export type AuthenticatedUser = {
  id: string;
  role: string;
  companyId:string;
};

const storage = new AsyncLocalStorage<AuthenticatedUser>();

export function runWithAuthUser(user: AuthenticatedUser, fn: () => void): void {
  storage.run(user, fn);
}

export function getAuthenticatedUserData(): AuthenticatedUser {
  const store = storage.getStore();
  if (!store) {
    throw new Error('No authenticated user in context');
  }
  return store;
}
