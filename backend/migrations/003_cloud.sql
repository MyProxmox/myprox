-- Cloud relay agent token stored with the server
ALTER TABLE proxmox_servers ADD COLUMN IF NOT EXISTS agent_token TEXT;

-- Cloud relays registry
CREATE TABLE IF NOT EXISTS cloud_relays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname VARCHAR NOT NULL,
  region VARCHAR DEFAULT 'eu',
  active BOOLEAN DEFAULT TRUE,
  capacity INT DEFAULT 1000,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default local relay for dev
INSERT INTO cloud_relays (hostname, region, active)
VALUES ('relay:8080', 'local', TRUE)
ON CONFLICT DO NOTHING;
