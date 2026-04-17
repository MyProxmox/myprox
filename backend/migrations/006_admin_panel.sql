-- Migration 006: Admin panel — user status management + activity log

-- Add status / ban / suspension columns to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status       VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ban_reason   TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- App-level event log (logins, admin actions, key user events)
CREATE TABLE IF NOT EXISTS app_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  meta       JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_events_user ON app_events(user_id);
CREATE INDEX IF NOT EXISTS idx_app_events_type ON app_events(event_type);
CREATE INDEX IF NOT EXISTS idx_app_events_created ON app_events(created_at DESC);
