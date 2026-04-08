import  {getAppDataSource}  from '../../shared/database/data-source';
import { hashPassword, verifyPassword } from '../../shared/utils/passwordUtils';
import { User } from './users.entity';
import { getAuthenticatedUserData } from '../../shared/auth/authContext';
import { invalidateUser } from '../../shared/auth/tokenInvalidation';
import { ListUsersResponseDto } from './users.dtos';

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

  const passwordHash = await hashPassword(payload.password);

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

  const passwordHash = await hashPassword(payload.password);

  user.passwordHash = passwordHash;
  await repo.save(user);
}

export async function listUsers(params: {
  companyId: string;
  offset: number;
  limit: number;
  search?: string;
}): Promise<ListUsersResponseDto> {
  const repo = getAppDataSource().getRepository(User);
  const qb = repo.createQueryBuilder('user').where('user.companyId = :companyId', { companyId: params.companyId });

  if (params.search) {
    qb.andWhere('user.email LIKE :search', { search: `%${params.search}%` });
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

type UpdateOwnSettingsPayload =
  | { action: 'change_password'; currentPassword: string; newPassword: string }
  | { action: 'sign_out_all_devices' };

export async function updateOwnSettings(payload: UpdateOwnSettingsPayload): Promise<void> {
  const { id } = getAuthenticatedUserData();

  if (payload.action === 'sign_out_all_devices') {
    await invalidateUser(id);
    return;
  }

  // change_password
  const repo = getAppDataSource().getRepository(User);
  const user = await repo.findOneBy({ id });
  if (!user) {
    const err: any = new Error('User not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const isValid = await verifyPassword(payload.currentPassword, user.passwordHash);

  if (!isValid) {
    const err: any = new Error('Current password is incorrect');
    err.code = 'WRONG_PASSWORD';
    err.status = 400;
    throw err;
  }

  const newPasswordHash = await hashPassword(payload.newPassword);

  user.passwordHash = newPasswordHash;
  await repo.save(user);
}
