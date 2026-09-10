'use strict';
/**
 * Health & Auth integration tests.
 *
 * Requires a running server on TEST_PORT (default 5001).
 * MongoDB is NOT required — MONGO_REQUIRED=false so tests run offline.
 *
 * Run: npm test
 */
const request = require('supertest');

// Load app without starting the HTTP server
let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-tests';
  process.env.MONGO_URI = '';          // No DB for unit tests
  process.env.MONGO_REQUIRED = 'false';
  app = require('../src/app');
});

// ──────────────────────────────────────────────────────────────────────────────
// Health
// ──────────────────────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status field', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('service', 'visiontrust-backend');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('also available at /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 404 fallback
// ──────────────────────────────────────────────────────────────────────────────
describe('Unknown routes', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Auth — DB not available so these return 503
// ──────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register (no DB)', () => {
  it('returns 503 when database is unavailable', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'secure123' });
    expect(res.statusCode).toBe(503);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login (no DB)', () => {
  it('returns 503 when database is unavailable', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'secure123' });
    expect(res.statusCode).toBe(503);
    expect(res.body.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Protected route — no token
// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/auth/me (no token)', () => {
  it('returns 401 when no JWT is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
