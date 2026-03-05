import crypto from 'crypto';
import  {getAppDataSource}  from '../../shared/database/data-source';
import { User } from './users.entity';
import { getAuthenticatedUserData } from '../../shared/auth/authContext';

export type AdminContext = { id: string; role: string; companyId?: string };

export async function createUserForCompany(
  payload: { email: string; password: string }
): Promise<User> {
  const authData = getAuthenticatedUserData();

  if (authData.role !== 'admin') {
    const err: any = new Error('Forbidden');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const repo = getAppDataSource().getRepository(User);
  const existing = await repo.findOneBy({ email: payload.email, companyId: authData.companyId });
  if (existing) {
    const err: any = new Error('Email already in use');
    err.code = 'DUPLICATE_EMAIL';
    err.status = 409;
    throw err;
  }

  // hash the provided password
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = await new Promise<string>((resolve, reject) => {
    crypto.scrypt(payload.password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });

  const companyId = authData.companyId;
  const user = repo.create({
    company:{ id: companyId },
    email: payload.email,
    passwordHash,
    role: 'manager',
  } as Partial<User>);

  const saved = await repo.save(user);
  return saved;
}

export async function deleteUserFromCompany(id: string, companyId:string): Promise<void> {

  if (getAuthenticatedUserData().role !== 'admin') {
    const err: any = new Error('Forbidden');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const repo = getAppDataSource().getRepository(User);
  const user = await repo.findOneBy({ id, companyId: companyId });
  if (!user) {
    const err: any = new Error('User not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
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

export async function updateUserPassword(payload: { id: string; password: string }): Promise<void> {
  const authData = getAuthenticatedUserData();
  if (authData.role !== 'admin') {
    const err: any = new Error('Forbidden');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const repo = getAppDataSource().getRepository(User);
  const user = await repo.findOneBy({ id: payload.id, companyId: authData.companyId });
  if (!user) {
    const err: any = new Error('User not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = await new Promise<string>((resolve, reject) => {
    crypto.scrypt(payload.password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });

  user.passwordHash = passwordHash;
  await repo.save(user);
}

export async function listUsers(params: {
  companyId: string;
  offset: number;
  limit: number;
  search?: string;
}): Promise<{ data: Array<{ id: string; email: string; role: string; companyId: string; createdAt: Date }>; total: number; hasMore: boolean }> {
  const repo = getAppDataSource().getRepository(User);
  const qb = repo.createQueryBuilder('user').where('user.companyId = :companyId', { companyId: params.companyId });

  if (params.search) {
    qb.andWhere('user.searchable LIKE :search', { search: `%${params.search}%` });
  }

  qb.orderBy('user.createdAt', 'DESC').addOrderBy('user.id', 'DESC');
  qb.skip(params.offset).take(params.limit);

  const [items, total] = await qb.getManyAndCount();

  return {
    data: items.map((u) => ({ id: u.id, email: u.email, role: u.role, companyId: u.companyId, createdAt: u.createdAt })),
    total,
    hasMore: params.offset + items.length < total,
  };
}
