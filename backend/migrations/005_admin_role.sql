-- Migration 005: Admin role column + default admin account
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user';

-- Default admin: admin@my.prox.app / Not24get
INSERT INTO users (email, password_hash, plan, role)
VALUES (
  'admin@my.prox.app',
  '$2a$10$jop//BT2qCwOXveaHYHJUuIEca5js5Not7oC9yCsQn8cGNYu7e04S',
  'admin',
  'admin'
)
ON CONFLICT (email) DO UPDATE SET role = 'admin', plan = 'admin';
