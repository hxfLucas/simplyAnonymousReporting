import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import ensureManager from '../ensureManager';
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
  app.get('/manager', ensureManager, (_req, res) => res.status(200).json({ ok: true }));
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

describe('ensureManager', () => {
  describe('when no access_token cookie is present', () => {
    it('returns 401', async () => {
      const res = await request(makeApp()).get('/manager');

      expect(res.status).toBe(401);
    });
  });

  describe('when authenticated user has role "admin"', () => {
    it('returns 200 (admin is also allowed)', async () => {
      const token = makeToken({
        sub: 'user-admin',
        email: 'admin@test.com',
        role: 'admin',
        companyId: 'c1',
      });

      const res = await request(makeApp())
        .get('/manager')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  describe('when authenticated user has role "manager"', () => {
    it('returns 200', async () => {
      const token = makeToken({
        sub: 'user-manager',
        email: 'manager@test.com',
        role: 'manager',
        companyId: 'c1',
      });

      const res = await request(makeApp())
        .get('/manager')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  describe('when authenticated user has role "viewer"', () => {
    it('returns 403 with { message: "Forbidden" }', async () => {
      const token = makeToken({
        sub: 'user-viewer',
        email: 'viewer@test.com',
        role: 'viewer',
        companyId: 'c1',
      });

      const res = await request(makeApp())
        .get('/manager')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Forbidden' });
    });
  });
});
