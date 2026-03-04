import { Request, Response } from 'express';
import { getAppDataSource } from '../../shared/database/data-source';
import { isValidEmail } from '../../shared/utils/validateEmail';
import { AddUserDto } from './users.dtos';
import { User } from './users.entity';
import { createUserForCompany, deleteUserFromCompany, updateUserPassword as updateUserPasswordService } from './users.service';
import { getAuthenticatedUserData } from '../../shared/auth/authContext';

export async function addUser(req: Request<{}, {}, AddUserDto>, res: Response) {

  const { email: rawEmail, password: rawPassword } = req.body ?? {};
  const email = String(rawEmail ?? '').trim().toLowerCase();
  const password = String(rawPassword ?? '').trim();

  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid or missing email' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const created = await createUserForCompany({ email, password });
  const { passwordHash, ...safe } = (created as any);
  return res.status(201).json(safe);
}

export async function updateUserPassword(req: Request, res: Response) {
  const { id, password: rawPassword } = req.body ?? {};
  const password = String(rawPassword ?? '').trim();

  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing or invalid user id' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  await updateUserPasswordService({ id, password });
  return res.sendStatus(204);
}

export async function removeUser(req: Request<{ id: string }>, res: Response) {
  const id: string = req.params?.id;
  if (!id) return res.status(400).json({ error: 'Missing user id' });

  const companyId = getAuthenticatedUserData().companyId;
  await deleteUserFromCompany(id,companyId);
  return res.status(200).json({ message: 'User removed' });
}

export async function usersList(req: Request, res: Response) {
  const { limit, page, size, search } = req.query;

  const companyId = getAuthenticatedUserData().companyId;

  const repo = getAppDataSource().getRepository(User);
  const qb = repo.createQueryBuilder('user').where('user.companyId = :companyId', { companyId });

  if (search) {
    qb.andWhere('user.searchable LIKE :search', { search: `%${String(search)}%` });
  }

  const pageNum = Number(page) || 1;
  const sizeNum = Number(size) || Number(limit) || 10;
  const calculatedOffset = (pageNum - 1) * sizeNum;

  qb.orderBy('user.id', 'DESC').limit(Number(limit) || sizeNum).offset(calculatedOffset);

  const items = await qb.getMany();

  return res.json({
    items: items.map((u) => ({ id: u.id, email: u.email, role: u.role, companyId: u.companyId, createdAt: u.createdAt })),
  });
}
