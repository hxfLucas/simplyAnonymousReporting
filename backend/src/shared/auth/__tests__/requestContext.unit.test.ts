import request from 'supertest';
import express from 'express';
import requestContextMiddleware from '../requestContext';

function makeApp() {
  const app = express();
  app.use(requestContextMiddleware as any);
  app.get('/', (req: any, res) => res.json({ requestId: req.context?.requestId }));
  return app;
}

describe('requestContextMiddleware', () => {
  it('attaches req.context with a requestId field', async () => {
    const res = await request(makeApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('requestId');
  });

  it('uses the x-request-id header as the requestId when provided', async () => {
    const customId = 'my-custom-request-id-123';

    const res = await request(makeApp())
      .get('/')
      .set('x-request-id', customId);

    expect(res.status).toBe(200);
    expect(res.body.requestId).toBe(customId);
  });

  it('falls back to a non-empty string when no x-request-id header is provided', async () => {
    const res = await request(makeApp()).get('/');

    expect(res.status).toBe(200);
    expect(typeof res.body.requestId).toBe('string');
    expect(res.body.requestId.length).toBeGreaterThan(0);
  });

  it('calls next() so the route handler is reached', async () => {
    const res = await request(makeApp()).get('/');

    // If next() was not called we would never reach the route handler
    expect(res.status).toBe(200);
  });
});
