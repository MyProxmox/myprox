import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../config/database';
import { ProxmoxService } from '../services/ProxmoxService';
import { decryptString } from '../utils/encryption';

const router = express.Router();

async function getProxmoxForServer(serverId: string, userId: string): Promise<ProxmoxService> {
  const result = await db.query(
    'SELECT local_ip, local_username, local_password_encrypted, mode FROM proxmox_servers WHERE id = $1 AND user_id = $2',
    [serverId, userId]
  );
  if (result.rows.length === 0) {
    throw Object.assign(new Error('Server not found'), { statusCode: 404 });
  }
  const server = result.rows[0];
  if (server.mode === 'cloud') {
    throw Object.assign(new Error('Node management not yet supported in cloud mode'), { statusCode: 400 });
  }
  const password = decryptString(server.local_password_encrypted);
  return ProxmoxService.create({ host: server.local_ip, username: server.local_username, password });
}

// GET /api/v1/servers/:serverId/node/status
// Returns CPU, RAM, disk usage for the first node
router.get('/:serverId/node/status', authMiddleware, async (req, res) => {
  try {
    const proxmox = await getProxmoxForServer(req.params.serverId, req.userId!);
    const nodes = await proxmox.getNodes();
    if (!nodes?.length) return res.status(404).json({ error: 'No nodes found' });

    const node = nodes[0].node;
    const [status, storage] = await Promise.all([
      proxmox.getNodeStatus(node),
      proxmox.getNodeStorage(node),
    ]);

    res.json({ node, status, storage });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// GET /api/v1/servers/:serverId/node/updates
// Returns list of available APT packages
router.get('/:serverId/node/updates', authMiddleware, async (req, res) => {
  try {
    const proxmox = await getProxmoxForServer(req.params.serverId, req.userId!);
    const nodes = await proxmox.getNodes();
    if (!nodes?.length) return res.status(404).json({ error: 'No nodes found' });

    const node = nodes[0].node;
    const updates = await proxmox.getAvailableUpdates(node);
    res.json({ node, updates: updates ?? [] });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// POST /api/v1/servers/:serverId/node/refresh-updates
// Refresh APT cache (apt update)
router.post('/:serverId/node/refresh-updates', authMiddleware, async (req, res) => {
  try {
    const proxmox = await getProxmoxForServer(req.params.serverId, req.userId!);
    const nodes = await proxmox.getNodes();
    if (!nodes?.length) return res.status(404).json({ error: 'No nodes found' });

    const task = await proxmox.runAptRefresh(nodes[0].node);
    res.json({ task, message: 'APT cache refresh initiated' });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// POST /api/v1/servers/:serverId/node/upgrade
// Run apt dist-upgrade — DANGEROUS, requires explicit user confirmation
router.post('/:serverId/node/upgrade', authMiddleware, async (req, res) => {
  try {
    const { confirmed } = req.body;
    if (!confirmed) {
      return res.status(400).json({
        error: 'Upgrade requires explicit confirmation. Send { "confirmed": true }.',
        warning: 'This will upgrade all OS packages and may require a reboot.',
      });
    }

    const proxmox = await getProxmoxForServer(req.params.serverId, req.userId!);
    const nodes = await proxmox.getNodes();
    if (!nodes?.length) return res.status(404).json({ error: 'No nodes found' });

    const task = await proxmox.upgradeNode(nodes[0].node);
    res.json({ task, message: 'Upgrade initiated. Monitor progress in Proxmox web UI.' });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// GET /api/v1/servers/:serverId/node/logs
// Recent cluster log entries
router.get('/:serverId/node/logs', authMiddleware, async (req, res) => {
  try {
    const max = Math.min(parseInt(req.query.max as string || '50', 10), 200);
    const proxmox = await getProxmoxForServer(req.params.serverId, req.userId!);
    const logs = await proxmox.getClusterLog(max);
    res.json({ logs: logs ?? [] });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
