import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../config/database';
import { RelayService } from '../services/RelayService';
import { generateAgentToken } from '../utils/jwt';

const router = express.Router();

// GET /api/v1/cloud/relay-status/:serverId
// Check if the local agent for this server is connected to the relay
router.get('/relay-status/:serverId', authMiddleware, async (req, res) => {
  try {
    const { serverId } = req.params;

    const result = await db.query(
      "SELECT id, mode FROM proxmox_servers WHERE id = $1 AND user_id = $2",
      [serverId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const server = result.rows[0];

    if (server.mode !== 'cloud') {
      return res.json({ mode: 'local', connected: true });
    }

    const connected = await RelayService.isAgentConnected(serverId);
    res.json({ mode: 'cloud', connected });
  } catch (error) {
    console.error('Relay status error:', error);
    res.status(500).json({ error: 'Failed to check relay status' });
  }
});

// POST /api/v1/cloud/regenerate-token/:serverId
// Regenerate the agent token (in case it's compromised)
router.post('/regenerate-token/:serverId', authMiddleware, async (req, res) => {
  try {
    const { serverId } = req.params;

    const result = await db.query(
      "SELECT id FROM proxmox_servers WHERE id = $1 AND user_id = $2 AND mode = 'cloud'",
      [serverId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cloud server not found' });
    }

    const agentToken = generateAgentToken(serverId, req.userId!);
    await db.query('UPDATE proxmox_servers SET agent_token = $1 WHERE id = $2', [agentToken, serverId]);

    res.json({ agentToken });
  } catch (error) {
    console.error('Regenerate token error:', error);
    res.status(500).json({ error: 'Failed to regenerate token' });
  }
});

export default router;
