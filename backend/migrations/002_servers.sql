-- Proxmox Servers
CREATE TABLE IF NOT EXISTS proxmox_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  mode VARCHAR DEFAULT 'local',
  local_ip VARCHAR,
  local_username VARCHAR,
  local_password_encrypted TEXT,
  verified BOOLEAN DEFAULT FALSE,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);
