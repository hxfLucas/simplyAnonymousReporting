import { runWithAuthUser, AuthenticatedUser } from '../auth/authContext';

export function runWithTestAuth<T>(
  user: AuthenticatedUser,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    runWithAuthUser(user, () => {
      fn().then(resolve).catch(reject);
    });
  });
}
