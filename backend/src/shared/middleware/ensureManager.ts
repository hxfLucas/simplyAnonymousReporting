import { RequestHandler, Request, Response, NextFunction } from 'express';
import { jwtGuard } from './jwtGuard';

// Ensure the request is authenticated (via jwtGuard) and the user is a manager or admin.
export const ensureManager: RequestHandler = (req, res, next) => {
  const afterJwt = (_err?: any) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role !== 'manager' && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return next();
  };

  jwtGuard(req as Request, res as Response, afterJwt as NextFunction);
};

export default ensureManager;
