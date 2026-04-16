import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../config/database';
import { ProxmoxService } from '../services/ProxmoxService';
import { CloudProxmoxService } from '../services/CloudProxmoxService';
import { decryptString } from '../utils/encryption';

const router = express.Router();

async function getProxmoxForServer(serverId: string, userId: string): Promise<ProxmoxService | CloudProxmoxService> {
  const result = await db.query(
    'SELECT mode, local_ip, local_username, local_password_encrypted FROM proxmox_servers WHERE id = $1 AND user_id = $2',
    [serverId, userId]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Server not found'), { statusCode: 404 });
  }

  const server = result.rows[0];

  if (server.mode === 'cloud') {
    return new CloudProxmoxService(serverId);
  }

  const password = decryptString(server.local_password_encrypted);
  return ProxmoxService.create({
    host: server.local_ip,
    username: server.local_username,
    password,
  });
}

// GET /api/v1/servers/:serverId/vms
router.get('/:serverId/vms', authMiddleware, async (req, res) => {
  try {
    const { serverId } = req.params;

    const proxmox = await getProxmoxForServer(serverId, req.userId!);
    const nodes = await proxmox.getNodes();

    const allVMs: any[] = [];
    const allContainers: any[] = [];

    for (const node of nodes) {
      const vms = await proxmox.getVMs(node.node);
      const containers = await proxmox.getContainers(node.node);

      vms.forEach((vm: any) => allVMs.push({ ...vm, type: 'qemu', node: node.node }));
      containers.forEach((ct: any) => allContainers.push({ ...ct, type: 'lxc', node: node.node }));
    }

    // Update last_sync
    await db.query('UPDATE proxmox_servers SET last_sync = NOW() WHERE id = $1', [serverId]);

    res.json({ vms: allVMs, containers: allContainers });
  } catch (error: any) {
    const status = error.statusCode || 500;
    console.error('Fetch VMs error:', error);
    res.status(status).json({ error: error.message || 'Failed to fetch VMs' });
  }
});

// POST /api/v1/servers/:serverId/vms/:vmid/action/:action
router.post('/:serverId/vms/:vmid/action/:action', authMiddleware, async (req, res) => {
  try {
    const { serverId, vmid, action } = req.params;
    const { type = 'qemu', node } = req.body;

    if (!node) {
      return res.status(400).json({ error: 'node is required' });
    }

    const validActions = ['start', 'stop', 'restart'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
    }

    const proxmox = await getProxmoxForServer(serverId, req.userId!);
    const id = parseInt(vmid, 10);
    let task: any;

    if (type === 'qemu') {
      if (action === 'start') task = await proxmox.startVM(node, id);
      else if (action === 'stop') task = await proxmox.stopVM(node, id);
      else if (action === 'restart') task = await proxmox.restartVM(node, id);
    } else if (type === 'lxc') {
      if (action === 'start') task = await proxmox.startContainer(node, id);
      else if (action === 'stop') task = await proxmox.stopContainer(node, id);
      else if (action === 'restart') task = await proxmox.restartContainer(node, id);
    } else {
      return res.status(400).json({ error: 'type must be qemu or lxc' });
    }

    res.json({ message: `${type} ${action} initiated`, task });
  } catch (error: any) {
    const status = error.statusCode || 500;
    console.error('VM action error:', error);
    res.status(status).json({ error: error.message || 'Failed to perform action' });
  }
});

// GET /api/v1/servers/:serverId/vms/:vmid — détails d'une VM/container
router.get('/:serverId/vms/:vmid', authMiddleware, async (req, res) => {
  try {
    const { serverId, vmid } = req.params;
    const { type = 'qemu', node } = req.query as { type?: string; node?: string };

    if (!node) {
      return res.status(400).json({ error: 'node query param is required' });
    }

    const proxmox = await getProxmoxForServer(serverId, req.userId!);
    const id = parseInt(vmid, 10);

    let status: any;
    if (type === 'lxc') {
      // LXC status
      const nodes = await proxmox.getNodes();
      const allContainers = await proxmox.getContainers(node);
      status = allContainers.find((c: any) => c.vmid === id);
    } else {
      const allVMs = await proxmox.getVMs(node);
      status = allVMs.find((v: any) => v.vmid === id);
    }

    if (!status) {
      return res.status(404).json({ error: 'VM/Container not found' });
    }

    res.json({ ...status, type, node });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    console.error('Get VM details error:', error);
    res.status(statusCode).json({ error: error.message || 'Failed to get VM details' });
  }
});

// DELETE /api/v1/servers/:serverId/vms/:vmid — supprimer une VM/container
router.delete('/:serverId/vms/:vmid', authMiddleware, async (req, res) => {
  try {
    const { serverId, vmid } = req.params;
    const { type = 'qemu', node } = req.body;

    if (!node) {
      return res.status(400).json({ error: 'node is required' });
    }

    const proxmox = await getProxmoxForServer(serverId, req.userId!) as ProxmoxService;
    const id = parseInt(vmid, 10);

    // Stop first (ignore error if already stopped or in wrong state)
    if (type === 'lxc') {
      await proxmox.stopContainer(node, id).catch(() => {});
    } else {
      await proxmox.stopVM(node, id).catch(() => {});
    }

    // Small delay to let Proxmox process the stop task
    await new Promise((r) => setTimeout(r, 2000));

    // Delete
    let task: any;
    if (type === 'lxc') {
      task = await proxmox.deleteContainer(node, id);
    } else {
      task = await proxmox.deleteVM(node, id);
    }

    res.json({ message: 'VM deletion initiated', task, vmid: id, node, type });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    console.error('Delete VM error:', error);
    res.status(statusCode).json({ error: error.message || 'Failed to delete VM' });
  }
});

// GET /api/v1/vms/:serverId/vnc-ticket
// Provides PVEAuthCookie required for NoVNC webview integration on mobile
router.get('/:serverId/vnc-ticket', authMiddleware, async (req, res) => {
  try {
    const { serverId } = req.params;
    const proxmox = await getProxmoxForServer(serverId, req.userId!);
    
    // Will throw if using CloudProxmoxService without implemented proxy
    const authData = proxmox.getAuthData();

    res.json(authData);
  } catch (error: any) {
    console.error('Get VNC ticket error:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to get VNC ticket' });
  }
});

export default router;
