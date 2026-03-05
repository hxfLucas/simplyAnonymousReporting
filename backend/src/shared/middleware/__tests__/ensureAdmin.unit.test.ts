import request from 'supertest';
import ensureAdmin from '../ensureAdmin';
import { invalidationMap } from '../../auth/tokenInvalidation';
import { TEST_JWT_SECRET, makeGuardTestApp, makeTestToken } from '../../test-helpers/guardTestUtils';

jest.mock('../../auth/authContext', () => ({
  runWithAuthUser: (_data: any, next: () => void) => next(),
}));

jest.mock('../../auth/tokenInvalidation', () => {
  const actual = jest.requireActual('../../auth/tokenInvalidation');
  return { ...actual };
});

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = TEST_JWT_SECRET;
});

beforeEach(() => {
  invalidationMap.clear();
});

describe('ensureAdmin', () => {
  describe('when no access_token cookie is present', () => {
    it('returns 401', async () => {
      const res = await request(makeGuardTestApp(ensureAdmin, '/admin')).get('/admin');

      expect(res.status).toBe(401);
    });
  });

  describe('when authenticated user has role "manager"', () => {
    it('returns 403 with { message: "Forbidden" }', async () => {
      const token = makeTestToken({
        sub: 'user-1',
        email: 'manager@test.com',
        role: 'manager',
        companyId: 'c1',
      });

      const res = await request(makeGuardTestApp(ensureAdmin, '/admin'))
        .get('/admin')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Forbidden' });
    });
  });

  describe('when authenticated user has role "admin"', () => {
    it('returns 200', async () => {
      const token = makeTestToken({
        sub: 'user-2',
        email: 'admin@test.com',
        role: 'admin',
        companyId: 'c1',
      });

      const res = await request(makeGuardTestApp(ensureAdmin, '/admin'))
        .get('/admin')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });
});
