import { Request, Response } from 'express';
import { getAppDataSource } from '../../shared/database/data-source';
import { User } from './users.entity';

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
