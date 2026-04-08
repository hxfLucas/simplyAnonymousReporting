import request from 'supertest';
import { DataSource } from 'typeorm';
import { Express } from 'express';
import { createTestDataSource } from '../../../shared/test-helpers/createTestDataSource';
import { createApp } from '../../../createApp';

// Mock the BullMQ notifications queue to avoid Redis connection attempts
jest.mock('../../notifications/notifications.queue', () => ({
  getNotificationQueue: jest.fn(() => ({
    add: jest.fn().mockResolvedValue(undefined),
  })),
}));

let ds: DataSource;
let app: Express;

const validUser = {
  email: 'auth-test@example.com',
  password: 'SecurePassword123!',
  company: 'Auth Test Company',
};

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_EXPIRATION = '900';        // 15 minutes
  process.env.JWT_REFRESH_EXPIRATION = '604800'; // 7 days

  ds = await createTestDataSource();
  app = await createApp(ds);
});

afterAll(async () => {
  await ds.destroy();
});

// ──────────────────────────────────────────────────────────────
// Helper: extract the raw Set-Cookie header strings as an array
// ──────────────────────────────────────────────────────────────
function getCookies(res: request.Response): string[] {
  const raw = res.headers['set-cookie'] as string | string[] | undefined;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function findCookie(res: request.Response, name: string): string | undefined {
  return getCookies(res).find((c) => c.startsWith(`${name}=`));
}

// ──────────────────────────────────────────────────────────────
// Sign Up
// ──────────────────────────────────────────────────────────────
describe('POST /auth/sign-up', () => {
  it('returns 201 with refresh_token and sets httpOnly access_token cookie on valid input', async () => {
    const res = await request(app).post('/auth/sign-up').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('refresh_token');
    expect(typeof res.body.refresh_token).toBe('string');

    const accessCookie = findCookie(res, 'access_token');
    expect(accessCookie).toBeDefined();
    expect(accessCookie).toMatch(/HttpOnly/i);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/auth/sign-up')
      .send({ password: 'pass123', company: 'Co' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/auth/sign-up')
      .send({ email: 'missing-pw@example.com', company: 'Co' });

    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    // validUser was already registered in the first test of this describe block
    const res = await request(app).post('/auth/sign-up').send(validUser);

    expect(res.status).toBe(409);
  });
});

// ──────────────────────────────────────────────────────────────
// Sign In
// ──────────────────────────────────────────────────────────────
describe('POST /auth/sign-in', () => {
  it('returns 200 with refresh_token and access_token cookie on valid credentials', async () => {
    const res = await request(app)
      .post('/auth/sign-in')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('refresh_token');
    expect(typeof res.body.refresh_token).toBe('string');
    expect(findCookie(res, 'access_token')).toBeDefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/auth/sign-in')
      .send({ email: validUser.email, password: 'wrongPassword!' });

    expect(res.status).toBe(401);
  });

  it('returns 401 on unknown email', async () => {
    const res = await request(app)
      .post('/auth/sign-in')
      .send({ email: 'nobody@example.com', password: validUser.password });

    expect(res.status).toBe(401);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/auth/sign-in')
      .send({ password: validUser.password });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/auth/sign-in')
      .send({ email: validUser.email });

    expect(res.status).toBe(400);
  });
});

// ──────────────────────────────────────────────────────────────
// Refresh Tokens
// ──────────────────────────────────────────────────────────────
describe('POST /auth/refresh-tokens', () => {
  let refreshToken: string;
  let accessTokenCookieHeader: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/sign-in')
      .send({ email: validUser.email, password: validUser.password });

    refreshToken = res.body.refresh_token as string;
    // Keep only the cookie value part (everything up to the first ';') so
    // supertest sends it as a proper Cookie header
    const raw = findCookie(res, 'access_token')!;
    accessTokenCookieHeader = raw.split(';')[0]; // e.g. "access_token=eyJ..."
  });

  it('returns 200 with a new token pair given a valid refresh_token and cookie', async () => {
    const res = await request(app)
      .post('/auth/refresh-tokens')
      .set('Cookie', accessTokenCookieHeader)
      .send({ refresh_token: refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('refresh_token');
    expect(findCookie(res, 'access_token')).toBeDefined();
  });

  it('returns 401 on tampered/invalid refresh_token', async () => {
    const res = await request(app)
      .post('/auth/refresh-tokens')
      .set('Cookie', accessTokenCookieHeader)
      .send({ refresh_token: 'tampered.invalid.token' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when refresh_token body field is missing', async () => {
    const res = await request(app)
      .post('/auth/refresh-tokens')
      .set('Cookie', accessTokenCookieHeader)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 when access_token cookie is absent', async () => {
    const res = await request(app)
      .post('/auth/refresh-tokens')
      .send({ refresh_token: refreshToken });

    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────────────────────
// Check Session
// ──────────────────────────────────────────────────────────────
describe('GET /auth/check-session', () => {
  let accessTokenCookieHeader: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/sign-in')
      .send({ email: validUser.email, password: validUser.password });

    const raw = findCookie(res, 'access_token')!;
    accessTokenCookieHeader = raw.split(';')[0];
  });

  it('returns 200 with session data when access_token cookie is valid', async () => {
    const res = await request(app)
      .get('/auth/check-session')
      .set('Cookie', accessTokenCookieHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('valid', true);
    expect(res.body).toHaveProperty('refresh_token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', validUser.email);
  });

  it('returns 401 when no access_token cookie is provided', async () => {
    const res = await request(app).get('/auth/check-session');

    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────────────────────
// Sign Out
// ──────────────────────────────────────────────────────────────
describe('POST /auth/sign-out', () => {
  it('returns 204 and clears the access_token cookie', async () => {
    const signInRes = await request(app)
      .post('/auth/sign-in')
      .send({ email: validUser.email, password: validUser.password });

    const raw = findCookie(signInRes, 'access_token')!;
    const accessTokenCookieHeader = raw.split(';')[0];

    const res = await request(app)
      .post('/auth/sign-out')
      .set('Cookie', accessTokenCookieHeader);

    expect(res.status).toBe(204);

    // clearCookie expires the cookie (Max-Age=0 or Expires in the past)
    const cleared = findCookie(res, 'access_token');
    if (cleared) {
      const isMaxAgeZero = /Max-Age=0/i.test(cleared);
      const isExpiredDate = /Expires=Thu, 01 Jan 1970/i.test(cleared);
      expect(isMaxAgeZero || isExpiredDate).toBe(true);
    }
  });
});
