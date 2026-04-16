import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../config/database';
import { PBSService } from '../services/PBSService';
import { decryptString } from '../utils/encryption';

const router = express.Router();

async function getPBSForServer(serverId: string, userId: string): Promise<PBSService> {
  const result = await db.query(
    'SELECT local_ip, local_username, local_password_encrypted, mode, server_type FROM proxmox_servers WHERE id = $1 AND user_id = $2',
    [serverId, userId]
  );
  if (result.rows.length === 0) {
    throw Object.assign(new Error('Server not found'), { statusCode: 404 });
  }
  const server = result.rows[0];
  if (server.server_type !== 'pbs') {
    throw Object.assign(new Error('This server is not a PBS instance'), { statusCode: 400 });
  }
  if (server.mode === 'cloud') {
    throw Object.assign(new Error('PBS management not yet supported in cloud mode'), { statusCode: 400 });
  }
  const password = decryptString(server.local_password_encrypted);
  return PBSService.create({ host: server.local_ip, username: server.local_username, password });
}

// GET /api/v1/servers/:serverId/pbs/datastores
router.get('/:serverId/pbs/datastores', authMiddleware, async (req, res) => {
  try {
    const pbs = await getPBSForServer(req.params.serverId, req.userId!);
    const datastores = await pbs.getDatastores();
    res.json({ datastores });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// GET /api/v1/servers/:serverId/pbs/datastores/:store/status
router.get('/:serverId/pbs/datastores/:store/status', authMiddleware, async (req, res) => {
  try {
    const pbs = await getPBSForServer(req.params.serverId, req.userId!);
    const status = await pbs.getDatastoreStatus(req.params.store);
    res.json(status);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// GET /api/v1/servers/:serverId/pbs/datastores/:store/snapshots
router.get('/:serverId/pbs/datastores/:store/snapshots', authMiddleware, async (req, res) => {
  try {
    const pbs = await getPBSForServer(req.params.serverId, req.userId!);
    const snapshots = await pbs.getSnapshots(req.params.store);
    res.json({ snapshots });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// GET /api/v1/servers/:serverId/pbs/tasks
router.get('/:serverId/pbs/tasks', authMiddleware, async (req, res) => {
  try {
    const pbs = await getPBSForServer(req.params.serverId, req.userId!);
    const store = req.query.store as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 200);
    const tasks = await pbs.getTasks(store, limit);
    res.json({ tasks });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
