import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../config/database';
import { ProxmoxService } from '../services/ProxmoxService';
import { encryptString, decryptString } from '../utils/encryption';
import { generateAgentToken } from '../utils/jwt';

const router = express.Router();

// GET /api/v1/servers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, mode, local_ip, local_username, verified, last_sync, created_at FROM proxmox_servers WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch servers error:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// POST /api/v1/servers
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, ip, username, password, mode = 'local' } = req.body;

    if (!name || !ip || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields: name, ip, username, password' });
    }

    if (!['local', 'cloud'].includes(mode)) {
      return res.status(400).json({ error: 'mode must be "local" or "cloud"' });
    }

    // Enforce free plan limits
    const userResult = await db.query('SELECT plan FROM users WHERE id = $1', [req.userId]);
    const plan = userResult.rows[0]?.plan || 'free';

    if (plan === 'free') {
      const countResult = await db.query(
        "SELECT COUNT(*) FROM proxmox_servers WHERE user_id = $1 AND mode = $2",
        [req.userId, mode]
      );
      const count = parseInt(countResult.rows[0].count, 10);
      const limit = mode === 'local' ? 5 : 1;
      if (count >= limit) {
        return res.status(403).json({
          error: `Free plan limit reached (${limit} ${mode} server${limit > 1 ? 's' : ''}). Upgrade to Premium.`,
        });
      }
    }

    // Test connection to Proxmox before saving (local mode only — cloud mode agent may not be running yet)
    if (mode === 'local') {
      const proxmox = await ProxmoxService.create({ host: ip, username, password });
      const nodes = await proxmox.getNodes();
      if (!nodes || nodes.length === 0) {
        return res.status(400).json({ error: 'No nodes found on Proxmox server' });
      }
    }

    const encryptedPassword = encryptString(password);

    const result = await db.query(
      'INSERT INTO proxmox_servers (user_id, name, mode, local_ip, local_username, local_password_encrypted, verified, last_sync) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id, name, mode, local_ip, local_username, verified',
      [req.userId, name, mode, ip, username, encryptedPassword, mode === 'local']
    );

    const server = result.rows[0];

    // Generate agent token for cloud mode
    let agentToken: string | undefined;
    if (mode === 'cloud') {
      agentToken = generateAgentToken(server.id, req.userId!);
      await db.query('UPDATE proxmox_servers SET agent_token = $1 WHERE id = $2', [agentToken, server.id]);
    }

    res.status(201).json({
      server,
      agentToken,
      message: mode === 'cloud'
        ? 'Server added in cloud mode. Configure your local agent with the agentToken.'
        : 'Server added successfully',
    });
  } catch (error: any) {
    console.error('Add server error:', error);
    const msg = error.code === '23505' ? 'A server with this name already exists' : error.message || 'Failed to add server';
    res.status(500).json({ error: msg });
  }
});

// DELETE /api/v1/servers/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM proxmox_servers WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json({ message: 'Server deleted' });
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ error: 'Failed to delete server' });
  }
});

// PUT /api/v1/servers/:id/mode — basculer Local ↔ Cloud
router.put('/:id/mode', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { mode } = req.body;

    if (!['local', 'cloud'].includes(mode)) {
      return res.status(400).json({ error: 'mode must be "local" or "cloud"' });
    }

    const result = await db.query(
      'UPDATE proxmox_servers SET mode = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name, mode',
      [mode, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update server mode error:', error);
    res.status(500).json({ error: 'Failed to update server mode' });
  }
});

export { decryptString };
export default router;
