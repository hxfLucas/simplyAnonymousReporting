import { Request, Response } from 'express';
import { getAppDataSource } from '../../shared/database/data-source';
import { User } from './users.entity';
import { createUserForCompany, deleteUserFromCompany } from './users.service';

export async function addUser(req: Request, res: Response) {
  try {
    const u = req.user!;
    const admin = { id: u.sub, role: u.role, companyId: (u as any).companyId };
    const { email, name } = req.body ?? {};

    if (typeof email !== 'string' || !email) return res.status(400).json({ error: 'Invalid or missing email' });
    if (typeof name !== 'string' || !name) return res.status(400).json({ error: 'Invalid or missing name' });

    try {
      const created = await createUserForCompany(admin, { email, name });
      const { password, ...safe } = (created as any);
      return res.status(201).json(safe);
    } catch (err: any) {
      if (err && err.code === 'DUPLICATE_EMAIL') return res.status(409).json({ error: 'Email already in use' });
      throw err;
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeUser(req: Request<{ id: string }>, res: Response) {
  try {
    const u = req.user!;
    const admin = { id: u.sub, role: u.role, companyId: (u as any).companyId };
    const id: string = req.params?.id;
    if (!id) return res.status(400).json({ error: 'Missing user id' });

    try {
      await deleteUserFromCompany(admin, id);
      return res.status(200).json({ message: 'User removed' });
    } catch (err: any) {
      if (err && err.code === 'NOT_FOUND') return res.status(404).json({ error: 'User not found' });
      if (err && err.code === 'FORBIDDEN') return res.status(403).json({ error: 'Cannot operate on users from other companies' });
      if (err && err.code === 'CANNOT_DELETE_ADMIN') return res.status(403).json({ error: 'Cannot delete admin users' });
      throw err;
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function usersList(req: Request, res: Response) {
  try {
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
      items: items.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, companyId: u.companyId })),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('usersList error', err);
    return res.sendStatus(500);
  }
}
