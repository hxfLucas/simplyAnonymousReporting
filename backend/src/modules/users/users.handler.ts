import { Request, Response } from 'express';
import { getAppDataSource } from '../../shared/database/data-source';
import { User } from './users.entity';
import { createUserForCompany, deleteUserFromCompany } from './users.service';

export async function addUser(req: Request, res: Response) {
  const u = req.user!;
  const admin = { id: u.sub, role: u.role, companyId: (u as any).companyId };
  const { email } = req.body ?? {};

  if (typeof email !== 'string' || !email) return res.status(400).json({ error: 'Invalid or missing email' });

  const created = await createUserForCompany(admin, { email });
  const { password, ...safe } = (created as any);
  return res.status(201).json(safe);
}

export async function removeUser(req: Request<{ id: string }>, res: Response) {
  const u = req.user!;
  const admin = { id: u.sub, role: u.role, companyId: (u as any).companyId };
  const id: string = req.params?.id;
  if (!id) return res.status(400).json({ error: 'Missing user id' });

  await deleteUserFromCompany(admin, id);
  return res.status(200).json({ message: 'User removed' });
}

export async function usersList(req: Request, res: Response) {
  const { limit, page, size, search } = req.query;

  const u = req.user!;
  const companyId = (u as any).companyId;
  if (!companyId) return res.sendStatus(401);

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
    items: items.map((u) => ({ id: u.id, email: u.email, role: u.role, companyId: u.companyId })),
  });
}
