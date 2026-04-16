import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';

// ── Minimal app setup (no Redis, no rate limits) ──────────────────────────────
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  || 'postgresql://myprox_user:testpass@localhost:5432/myprox_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-32-chars!!';
process.env.ENCRYPTION_KEY = 'test-encryption-key-exactly32ch!';
process.env.NODE_ENV = 'test';

import authRoutes from '../routes/auth';
import { db } from '../config/database';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';

beforeAll(async () => {
  // Ensure migrations have run on test DB
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR UNIQUE NOT NULL,
      password_hash VARCHAR NOT NULL,
      plan VARCHAR DEFAULT 'free',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      access_token VARCHAR UNIQUE NOT NULL,
      refresh_token VARCHAR UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
});

afterAll(async () => {
  await db.query('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [TEST_EMAIL]);
  await db.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  await (db as Pool).end();
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user.plan).toBe('free');
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'other@example.com', password: '123' });

    expect(res.status).toBe(400);
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'x@x.com' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });

  it('handles login immediately after register without duplicate token (lessons #1)', async () => {
    // Regression test for the UNIQUE constraint on access_token when
    // register and login happen in the same second (same JWT iat).
    const email = `fast_${Date.now()}@example.com`;
    await request(app).post('/api/v1/auth/register').send({ email, password: TEST_PASSWORD });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');

    // cleanup
    await db.query('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [email]);
    await db.query('DELETE FROM users WHERE email = $1', [email]);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns a new access token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const { refreshToken } = loginRes.body;

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('rejects invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-valid-token' });

    expect(res.status).toBe(401);
  });
});
