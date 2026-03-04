import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { runWithAuthUser } from '../../shared/auth/authContext';

type AccessTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  role: string;
};

export function jwtGuard(req: Request, res: Response, next: NextFunction): void {
  const accessToken = req.cookies?.access_token as string | undefined;
  if (!accessToken) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ message: 'JWT_SECRET is not configured' });
    return;
  }

  try {
    const payload = jwt.verify(accessToken, secret, { algorithms: ['HS256'] }) as AccessTokenPayload;
    req.user = payload;
    runWithAuthUser({ id: payload.sub, role: payload.role }, next);
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}
