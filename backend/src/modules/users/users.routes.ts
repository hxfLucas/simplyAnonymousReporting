import { Router, Request, Response } from 'express';
import ensureAdmin from '../../shared/middleware/ensureAdmin';
import { createUserForCompany, deleteUserFromCompany } from './users.service';
import { usersList } from './users.list.handler';

const router = Router();

// POST /users/add-user
router.post('/add-user', ensureAdmin, async (req: Request, res: Response) => {
  try {
    const u = req.user!; // ensureAdmin guarantees presence and role
    const admin = { id: u.sub, role: u.role, companyId: (u as any).companyId };
    const { email, name } = req.body ?? {};

    if (typeof email !== 'string' || !email) return res.status(400).json({ error: 'Invalid or missing email' });
    if (typeof name !== 'string' || !name) return res.status(400).json({ error: 'Invalid or missing name' });

    try {
      const created = await createUserForCompany(admin, { email, name });
      // omit sensitive fields if present
      const { password, ...safe } = (created as any);
      return res.status(201).json(safe);
    } catch (err: any) {
      if (err && err.code === 'DUPLICATE_EMAIL') return res.status(409).json({ error: 'Email already in use' });
      throw err;
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /users/remove-user/:id
router.delete('/remove-user/:id', ensureAdmin, async (req: Request<{ id: string }>, res: Response) => {
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
});

router.get('/list', ensureAdmin, usersList);

export default router;
