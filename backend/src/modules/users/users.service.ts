import { AuthenticatedUser } from './../../shared/auth/authContext';
import crypto from 'crypto';
import  {getAppDataSource}  from '../../shared/database/data-source';
import { User } from './users.entity';
import { getAuthenticatedUserData } from '../../shared/auth/authContext';

export type AdminContext = { id: string; role: string; companyId?: string };

export async function createUserForCompany(
  payload: { email: string; }
): Promise<User> {

  if (getAuthenticatedUserData().role !== 'admin') {
    const err: any = new Error('Forbidden');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const repo = getAppDataSource().getRepository(User);
  const existing = await repo.findOneBy({ email: payload.email, companyId: getAuthenticatedUserData().companyId });
  if (existing) {
    const err: any = new Error('Email already in use');
    err.code = 'DUPLICATE_EMAIL';
    err.status = 409;
    throw err;
  }

  // generate a random password and hash it using the same scheme as auth.handler
  const password = crypto.randomBytes(8).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = await new Promise<string>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });

  const companyId = getAuthenticatedUserData().companyId;
  const user = repo.create({
    company:{ id: companyId },
    email: payload.email,
    passwordHash,
    role: 'manager',
  } as Partial<User>);

  const saved = await repo.save(user);
  return saved;
}

export async function deleteUserFromCompany(id: string): Promise<void> {
  const authData = getAuthenticatedUserData();
  if (authData.role !== 'admin') {
    const err: any = new Error('Forbidden');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const repo = getAppDataSource().getRepository(User);
  const user = await repo.findOneBy({ id, companyId: authData.companyId });
  if (!user) {
    const err: any = new Error('User not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (user.companyId !== authData.companyId) {
    const err: any = new Error('Cannot operate on users from other companies');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  if (user.role === 'admin') {
    const err: any = new Error('Cannot delete admin users');
    err.code = 'CANNOT_DELETE_ADMIN';
    err.status = 403;
    throw err;
  }

  await repo.remove(user);
}
