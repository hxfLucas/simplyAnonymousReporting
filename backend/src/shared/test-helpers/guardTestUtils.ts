import express, { RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

export const TEST_JWT_SECRET = 'test-secret';

/**
 * Build a minimal Express app that applies `middleware` on GET `route`.
 * The success handler responds with `{ ok: true }`.
 */
export function makeGuardTestApp(middleware: RequestHandler, route = '/protected') {
  const app = express();
  app.use(cookieParser());
  app.get(route, middleware, (_req, res) => res.status(200).json({ ok: true }));
  return app;
}

/**
 * Sign a JWT with the test secret.
 */
export function makeTestToken(
  payload: object,
  secret = TEST_JWT_SECRET,
  opts: jwt.SignOptions = {},
) {
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1h', ...opts });
}
