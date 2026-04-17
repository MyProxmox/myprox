import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { hashPassword, verifyPassword } from '../utils/encryption';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { db } from '../config/database';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, plan) VALUES ($1, $2, $3) RETURNING id, email, plan',
      [email, passwordHash, 'free']
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Purge old sessions for this user before creating a new one
    await db.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
    await db.query(
      "INSERT INTO sessions (user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')",
      [user.id, accessToken, refreshToken]
    );

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await db.query(
      'SELECT id, email, password_hash, plan, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await verifyPassword(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Purge old sessions for this user before creating a new one
    await db.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
    await db.query(
      "INSERT INTO sessions (user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')",
      [user.id, accessToken, refreshToken]
    );
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    res.json({
      user: { id: user.id, email: user.email, plan: user.plan, role: user.role ?? 'user' },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await db.query('DELETE FROM sessions WHERE access_token = $1', [token]);
    }
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
