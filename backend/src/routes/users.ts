import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../config/database';

const router = express.Router();

// GET /api/v1/user/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, plan, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/v1/user/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const result = await db.query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, plan',
      [email, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
