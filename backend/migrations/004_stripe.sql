-- Migration 004: Stripe integration
-- Adds stripe_customer_id and stripe_subscription_id to users table

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_period_end       TIMESTAMP WITH TIME ZONE;

-- Index for webhook lookups by stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- Track plan change events for audit
CREATE TABLE IF NOT EXISTS subscription_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  VARCHAR(100) NOT NULL,
  stripe_event_id VARCHAR(255) UNIQUE,
  payload     JSONB,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_user ON subscription_events(user_id);
