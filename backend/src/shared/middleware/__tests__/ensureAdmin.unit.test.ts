import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import ensureAdmin from '../ensureAdmin';
import { invalidationMap } from '../../auth/tokenInvalidation';

jest.mock('../../auth/authContext', () => ({
  runWithAuthUser: (_data: any, next: () => void) => next(),
}));

jest.mock('../../auth/tokenInvalidation', () => {
  const actual = jest.requireActual('../../auth/tokenInvalidation');
  return { ...actual };
});

const SECRET = 'test-secret';

function makeApp() {
  const app = express();
  app.use(cookieParser());
  app.get('/admin', ensureAdmin, (_req, res) => res.status(200).json({ ok: true }));
  return app;
}

function makeToken(payload: object, opts: jwt.SignOptions = {}) {
  return jwt.sign(payload, SECRET, { algorithm: 'HS256', expiresIn: '1h', ...opts });
}

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = SECRET;
});

beforeEach(() => {
  invalidationMap.clear();
});

describe('ensureAdmin', () => {
  describe('when no access_token cookie is present', () => {
    it('returns 401', async () => {
      const res = await request(makeApp()).get('/admin');

      expect(res.status).toBe(401);
    });
  });

  describe('when authenticated user has role "manager"', () => {
    it('returns 403 with { message: "Forbidden" }', async () => {
      const token = makeToken({
        sub: 'user-1',
        email: 'manager@test.com',
        role: 'manager',
        companyId: 'c1',
      });

      const res = await request(makeApp())
        .get('/admin')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Forbidden' });
    });
  });

  describe('when authenticated user has role "admin"', () => {
    it('returns 200', async () => {
      const token = makeToken({
        sub: 'user-2',
        email: 'admin@test.com',
        role: 'admin',
        companyId: 'c1',
      });

      const res = await request(makeApp())
        .get('/admin')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });
});
