import { Router } from 'express';
import ensureAdmin from '../../shared/middleware/ensureAdmin';
import ensureManager from '../../shared/middleware/ensureManager';
import { addUser, removeUser, usersList, updateUserPassword } from './users.handler';

const router = Router();

router.post('/add-user', ensureAdmin, addUser);
router.delete('/remove-user/:id', ensureAdmin, removeUser);
router.get('/list', ensureManager, usersList);
router.patch('/update-user', ensureAdmin, updateUserPassword);

export default router;
