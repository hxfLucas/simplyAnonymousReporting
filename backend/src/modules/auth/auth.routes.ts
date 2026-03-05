import { Router } from 'express';
import { checkSession, refreshTokens, signIn, signOut, signUp, getNotifications } from './auth.handler';
import { jwtGuard } from './jwtGuard';
import { validateBody } from '../../shared/middleware/validateBody';
import { SignInDto, SignUpDto, RefreshTokensDto } from './auth.dtos';

const authRouter = Router();

authRouter.post('/sign-in', validateBody(SignInDto), signIn);
authRouter.post('/sign-up', validateBody(SignUpDto), signUp);
authRouter.post('/refresh-tokens', validateBody(RefreshTokensDto), refreshTokens);
authRouter.get('/check-session', jwtGuard, checkSession);
authRouter.get('/notifications', jwtGuard, getNotifications);
authRouter.post('/sign-out', signOut);

export default authRouter;

