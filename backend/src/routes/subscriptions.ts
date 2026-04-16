import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../config/database';

const router = express.Router();

// GET /api/v1/subscriptions/plan
router.get('/plan', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT plan, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { plan } = result.rows[0];
    const limits = plan === 'premium'
      ? { localServers: null, cloudServers: null, bandwidthGB: null }
      : { localServers: 5, cloudServers: 1, bandwidthGB: 10 };

    res.json({ plan, limits });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

export default router;
