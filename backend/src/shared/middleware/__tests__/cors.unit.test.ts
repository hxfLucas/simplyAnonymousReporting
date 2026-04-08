import request from 'supertest';
import express from 'express';
import createCorsMiddleware from '../cors';

function makeApp(origins?: string) {
  // createCorsMiddleware reads CORS_ALLOWED_ORIGINS at call time
  process.env.CORS_ALLOWED_ORIGINS = origins ?? '';
  const app = express();
  app.use(createCorsMiddleware());
  app.get('/', (_req, res) => res.sendStatus(200));
  return app;
}

afterEach(() => {
  delete process.env.CORS_ALLOWED_ORIGINS;
});

describe('createCorsMiddleware', () => {
  describe('with a single allowed origin', () => {
    it('mirrors that origin in the response header', async () => {
      const res = await request(makeApp('http://example.com'))
        .get('/')
        .set('Origin', 'http://example.com');

      expect(res.headers['access-control-allow-origin']).toBe('http://example.com');
    });

    it('does not set the ACAO header for a disallowed origin', async () => {
      const res = await request(makeApp('http://example.com'))
        .get('/')
        .set('Origin', 'http://other.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('with multiple comma-separated allowed origins', () => {
    it('mirrors the matching origin from the list', async () => {
      const res = await request(makeApp('http://a.com,http://b.com'))
        .get('/')
        .set('Origin', 'http://b.com');

      expect(res.headers['access-control-allow-origin']).toBe('http://b.com');
    });

    it('does not set the ACAO header for an origin not in the list', async () => {
      const res = await request(makeApp('http://a.com,http://b.com'))
        .get('/')
        .set('Origin', 'http://c.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('with CORS_ALLOWED_ORIGINS unset (empty string)', () => {
    it('is permissive and echoes back the requesting origin', async () => {
      const res = await request(makeApp(''))
        .get('/')
        .set('Origin', 'http://anything.com');

      // When originList is undefined, cors({ origin: true }) echoes the request origin
      expect(res.headers['access-control-allow-origin']).toBeTruthy();
    });
  });

  describe('credentials flag', () => {
    it('always includes Access-Control-Allow-Credentials: true', async () => {
      const res = await request(makeApp('http://example.com'))
        .get('/')
        .set('Origin', 'http://example.com');

      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });
});
