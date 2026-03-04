import { Router } from 'express';
import ensureAdmin from '../../shared/middleware/ensureAdmin';
import { addUser, removeUser, usersList } from './users.handler';

const router = Router();

router.post('/add-user', ensureAdmin, addUser);
router.delete('/remove-user/:id', ensureAdmin, removeUser);
router.get('/list', ensureAdmin, usersList);

export default router;
