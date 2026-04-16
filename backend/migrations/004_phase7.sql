-- Phase 7: Proxmox Backup Server support + diagnostics
ALTER TABLE proxmox_servers ADD COLUMN IF NOT EXISTS server_type VARCHAR DEFAULT 'pve';

-- Index for faster queries per server type
CREATE INDEX IF NOT EXISTS idx_proxmox_servers_type ON proxmox_servers(user_id, server_type);
