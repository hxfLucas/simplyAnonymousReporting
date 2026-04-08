import { Router } from 'express';
import ensureAdmin from '../../shared/middleware/ensureAdmin';
import ensureManager from '../../shared/middleware/ensureManager';
import { jwtGuard } from '../../shared/middleware/jwtGuard';
import { addUser, removeUser, usersList, updateUserPassword, updateOwnSettingsHandler } from './users.handler';
import { validateBody } from '../../shared/middleware/validateBody';
import { AddUserDto, UpdateUserPasswordDto } from './users.dtos';

const router = Router();

router.post('/add-user', ensureAdmin,addUser);
router.delete('/remove-user/:id', ensureAdmin, removeUser);
router.get('/list', ensureManager, usersList);
router.patch('/update-user', ensureAdmin, updateUserPassword);
router.put('/settings', jwtGuard, updateOwnSettingsHandler);

export default router;
