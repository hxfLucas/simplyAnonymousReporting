import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { jwtGuard } from '../../../shared/middleware/jwtGuard';
import { invalidationMap } from '../../../shared/auth/tokenInvalidation';
import { TEST_JWT_SECRET, makeTestToken } from '../../../shared/test-helpers/guardTestUtils';

// Mock runWithAuthUser to just call next() so we don't need AsyncLocalStorage
jest.mock('../../../shared/auth/authContext', () => ({
  runWithAuthUser: (_data: any, next: () => void) => next(),
}));

// Mock isTokenInvalidated to use the real implementation but with our invalidationMap
jest.mock('../../../shared/auth/tokenInvalidation', () => {
  const actual = jest.requireActual('../../../shared/auth/tokenInvalidation');
  return {
    ...actual,
  };
});

function makeApp() {
  const app = express();
  app.use(cookieParser());
  app.get('/protected', jwtGuard, (req: any, res) =>
    res.status(200).json({ ok: true, user: req.user }),
  );
  return app;
}

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = TEST_JWT_SECRET;
});

beforeEach(() => {
  invalidationMap.clear();
});

describe('jwtGuard', () => {
  describe('when no access_token cookie is present', () => {
    it('returns 401 with { error: "unauthorized" }', async () => {
      const res = await request(makeApp()).get('/protected');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });
  });

  describe('when JWT_ACCESS_SECRET env var is not set', () => {
    it('returns 500 with a configuration error message', async () => {
      const original = process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_ACCESS_SECRET;

      const token = jwt.sign(
        { sub: 'user-1', email: 'a@b.com', role: 'admin', companyId: 'c1' },
        original!,
        { algorithm: 'HS256' },
      );

      const res = await request(makeApp())
        .get('/protected')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'JWT_ACCESS_SECRET is not configured');

      process.env.JWT_ACCESS_SECRET = original;
    });
  });

  describe('when the cookie contains a JWT signed with a wrong secret', () => {
    it('returns 401 with { message: "invalid_token" }', async () => {
      const token = makeTestToken(
        { sub: 'user-1', email: 'a@b.com', role: 'admin', companyId: 'c1' },
        'wrong-secret',
      );

      const res = await request(makeApp())
        .get('/protected')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'invalid_token' });
    });
  });

  describe('when the cookie contains an expired JWT', () => {
    it('returns 401 with { message: "invalid_token" }', async () => {
      const token = makeTestToken(
        { sub: 'user-1', email: 'a@b.com', role: 'admin', companyId: 'c1' },
        TEST_JWT_SECRET,
        { expiresIn: -10 }, // already expired
      );

      const res = await request(makeApp())
        .get('/protected')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'invalid_token' });
    });
  });

  describe('when the token has been invalidated', () => {
    it('returns 401 with { message: "token_invalidated" }', async () => {
      const userId = 'user-invalidated';
      // Set invalidation timestamp to a future second so any newly-issued
      // token (whose iat is "now") satisfies iat <= invalidatedBefore
      const futureSeconds = Math.floor(Date.now() / 1000) + 60;
      invalidationMap.set(userId, futureSeconds);

      const token = makeTestToken({
        sub: userId,
        email: 'inv@b.com',
        role: 'admin',
        companyId: 'c1',
      });

      const res = await request(makeApp())
        .get('/protected')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'token_invalidated' });
    });
  });

  describe('when a valid, non-invalidated JWT is present', () => {
    it('returns 200 and calls next(), populating req.user', async () => {
      const userId = 'user-valid';
      const token = makeTestToken({
        sub: userId,
        email: 'valid@b.com',
        role: 'manager',
        companyId: 'comp-42',
      });

      const res = await request(makeApp())
        .get('/protected')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.user).toMatchObject({
        sub: userId,
        email: 'valid@b.com',
        role: 'manager',
        companyId: 'comp-42',
      });
    });
  });
});
