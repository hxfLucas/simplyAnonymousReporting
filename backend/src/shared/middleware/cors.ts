import cors from 'cors';
import { RequestHandler } from 'express';

export default function createCorsMiddleware(): RequestHandler {
  const origins = process.env.CORS_ALLOWED_ORIGINS || '';
  const originList = origins ? origins.split(',').map(s => s.trim()) : undefined;
  return cors({ origin: originList || true, credentials: true });
}
