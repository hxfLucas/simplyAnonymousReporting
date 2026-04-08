import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { runWithAuthUser } from '../auth/authContext';
import { isTokenInvalidated } from '../auth/tokenInvalidation';

type AccessTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  role: string;
  companyId: string;
};

export function jwtGuard(req: Request, res: Response, next: NextFunction): void {
  const accessToken = req.cookies?.access_token as string | undefined;
  if (!accessToken) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    res.status(500).json({ message: 'JWT_ACCESS_SECRET is not configured' });
    return;
  }

  try {
    const payload = jwt.verify(accessToken, secret, { algorithms: ['HS256'] }) as AccessTokenPayload;
    if (isTokenInvalidated(payload.sub, payload.iat ?? 0)) {
      res.status(401).json({ message: 'token_invalidated' });
      return;
    }
    req.user = payload;
    runWithAuthUser({ id: payload.sub, role: payload.role, companyId: payload.companyId }, next);
  } catch {
    res.status(401).json({ message: 'invalid_token' });
  }
}
