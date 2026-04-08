import { Request, Response, NextFunction } from 'express';

export function requestContextMiddleware(req: Request & { context?: any }, res: Response, next: NextFunction){
  // Attach a simple context object to the request for per-request state
  req.context = { requestId: req.headers['x-request-id'] || Date.now().toString() };
  next();
}

export default requestContextMiddleware;
