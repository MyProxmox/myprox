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

    const usage = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE mode = 'local') AS local_count,
        COUNT(*) FILTER (WHERE mode = 'cloud') AS cloud_count
       FROM proxmox_servers WHERE user_id = $1`,
      [req.userId]
    );

    res.json({
      plan,
      limits,
      usage: {
        localServers: parseInt(usage.rows[0].local_count),
        cloudServers: parseInt(usage.rows[0].cloud_count),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

export default router;
