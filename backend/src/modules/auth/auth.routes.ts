import { Router } from 'express';
import { jwtGuard } from '../../shared/middleware/jwtGuard';
import { checkSession, getNotifications, refreshTokens, signIn, signOut, signUp } from './auth.handler';
import withTransaction from '../../shared/middleware/withTransaction';

const authRouter = Router();

authRouter.post('/sign-in',  signIn);
authRouter.post('/sign-up',withTransaction, signUp);
authRouter.post('/refresh-tokens', refreshTokens);
authRouter.get('/check-session', jwtGuard, checkSession);
authRouter.get('/notifications', jwtGuard, getNotifications);
authRouter.post('/sign-out', signOut);

export default authRouter;

