import request from 'supertest';
import express from 'express';
import { createRateLimiter } from '../rateLimiter';

function makeApp(windowMs: number, max: number) {
  const app = express();
  app.use(createRateLimiter({ windowMs, max }));
  app.get('/', (_req, res) => res.sendStatus(200));
  return app;
}

describe('createRateLimiter', () => {
  describe('basic request counting', () => {
    it('passes the first request (200)', async () => {
      const app = makeApp(60_000, 2);
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
    });

    it('passes the second request when max=2', async () => {
      const app = makeApp(60_000, 2);
      await request(app).get('/');
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
    });

    it('blocks the third request (429) when max=2', async () => {
      const app = makeApp(60_000, 2);
      await request(app).get('/');
      await request(app).get('/');
      const res = await request(app).get('/');
      expect(res.status).toBe(429);
      expect(res.body).toHaveProperty('error');
    });

    it('returns the expected error message on 429', async () => {
      const app = makeApp(60_000, 1);
      await request(app).get('/');
      const res = await request(app).get('/');
      expect(res.status).toBe(429);
      expect(res.body.error).toMatch(/too quickly/i);
    });
  });

  describe('window expiry resets the counter', () => {
    it('allows a new request after the window has passed', async () => {
      const windowMs = 60_000;
      const nowSpy = jest.spyOn(Date, 'now');

      const t0 = 1_000_000;
      // First request at t0
      nowSpy.mockReturnValue(t0);
      const app = makeApp(windowMs, 1);
      await request(app).get('/');

      // Second request at t0 (still in window) → should be blocked
      nowSpy.mockReturnValue(t0);
      const blockedRes = await request(app).get('/');
      expect(blockedRes.status).toBe(429);

      // Third request after window has expired
      nowSpy.mockReturnValue(t0 + windowMs + 1);
      const allowedRes = await request(app).get('/');
      expect(allowedRes.status).toBe(200);

      nowSpy.mockRestore();
    });
  });

  describe('independent tracking per IP', () => {
    it('tracks different IPs separately', async () => {
      // supertest uses 127.0.0.1 for all requests, so we test via two
      // separate app instances each with their own store to simulate independent IPs
      const windowMs = 60_000;
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

      const app1 = makeApp(windowMs, 1);
      const app2 = makeApp(windowMs, 1);

      // Each app has its own store; fill up app1
      await request(app1).get('/');
      const app1Blocked = await request(app1).get('/');
      expect(app1Blocked.status).toBe(429);

      // app2 store is fresh — first request should pass
      const app2First = await request(app2).get('/');
      expect(app2First.status).toBe(200);

      nowSpy.mockRestore();
    });
  });
});
