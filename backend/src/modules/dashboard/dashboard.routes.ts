import { Router } from 'express';
import { jwtGuard } from '../../shared/middleware/jwtGuard';
import { dashboardFetchHandler } from './dashboard.handler';

const router = Router();

router.get('/fetch', jwtGuard, dashboardFetchHandler);

export default router;
