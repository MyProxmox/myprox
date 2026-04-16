import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  || 'postgresql://myprox_user:testpass@localhost:5432/myprox_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-32-chars!!';
process.env.ENCRYPTION_KEY = 'test-encryption-key-exactly32ch!';
process.env.NODE_ENV = 'test';

import authRoutes from '../routes/auth';
import serverRoutes from '../routes/servers';
import { db } from '../config/database';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/servers', serverRoutes);

const TEST_EMAIL = `srv_${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';
let accessToken: string;
let createdServerId: string;

beforeAll(async () => {
  // Ensure tables exist
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
  await db.query(`
    CREATE TABLE IF NOT EXISTS proxmox_servers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR NOT NULL,
      mode VARCHAR DEFAULT 'local',
      server_type VARCHAR DEFAULT 'pve',
      local_ip VARCHAR,
      local_username VARCHAR,
      local_password_encrypted TEXT,
      agent_token TEXT,
      verified BOOLEAN DEFAULT FALSE,
      last_sync TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, name)
    )
  `);

  // Register + login to get token
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  accessToken = reg.body.accessToken;
});

afterAll(async () => {
  await db.query('DELETE FROM proxmox_servers WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [TEST_EMAIL]);
  await db.query('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [TEST_EMAIL]);
  await db.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  await (db as Pool).end();
});

describe('GET /api/v1/servers', () => {
  it('returns empty list for new user', async () => {
    const res = await request(app)
      .get('/api/v1/servers')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/servers');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/servers (cloud mode — no Proxmox connection needed)', () => {
  it('adds a cloud server and returns agent token', async () => {
    const res = await request(app)
      .post('/api/v1/servers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Cloud Server',
        ip: '10.0.0.1',
        username: 'root@pam',
        password: 'testpass',
        mode: 'cloud',
      });

    expect(res.status).toBe(201);
    expect(res.body.server.mode).toBe('cloud');
    expect(res.body.server.verified).toBe(false);
    expect(res.body.agentToken).toBeTruthy();
    createdServerId = res.body.server.id;
  });

  it('rejects duplicate server name', async () => {
    const res = await request(app)
      .post('/api/v1/servers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Cloud Server',
        ip: '10.0.0.2',
        username: 'root@pam',
        password: 'testpass',
        mode: 'cloud',
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/servers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Incomplete' });

    expect(res.status).toBe(400);
  });

  it('rejects invalid mode', async () => {
    const res = await request(app)
      .post('/api/v1/servers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Bad Mode', ip: '1.2.3.4', username: 'root@pam', password: 'pass', mode: 'invalid' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/servers (after add)', () => {
  it('lists the created server', async () => {
    const res = await request(app)
      .get('/api/v1/servers')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Test Cloud Server');
  });
});

describe('DELETE /api/v1/servers/:id', () => {
  it('deletes the server', async () => {
    const res = await request(app)
      .delete(`/api/v1/servers/${createdServerId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 for already deleted server', async () => {
    const res = await request(app)
      .delete(`/api/v1/servers/${createdServerId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 for server belonging to another user', async () => {
    const res = await request(app)
      .delete('/api/v1/servers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});
