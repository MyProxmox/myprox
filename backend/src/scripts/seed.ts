/**
 * Dev seed script — creates test account + Proxmox server
 * Usage: npx ts-node src/scripts/seed.ts
 */
import { db } from '../config/database';
import { hashPassword, encryptString } from '../utils/encryption';

async function seed() {
  console.log('🌱 Seeding dev database...');

  // Create test user
  const email = 'test@test.test';
  const password = 'test';
  const passwordHash = await hashPassword(password);

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);

  let userId: string;
  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;
    // Update password in case it changed
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    console.log(`✅ User already exists, password updated: ${email}`);
  } else {
    const result = await db.query(
      "INSERT INTO users (email, password_hash, plan) VALUES ($1, $2, 'free') RETURNING id",
      [email, passwordHash]
    );
    userId = result.rows[0].id;
    console.log(`✅ User created: ${email}`);
  }

  // Add Proxmox server
  const serverName = 'HomeProx';
  const ip = '10.20.0.253';
  const username = 'root@pam';
  const proxPassword = 'Not24get';
  const encryptedPassword = encryptString(proxPassword);

  const existingServer = await db.query(
    'SELECT id FROM proxmox_servers WHERE user_id = $1 AND name = $2',
    [userId, serverName]
  );

  if (existingServer.rows.length > 0) {
    await db.query(
      'UPDATE proxmox_servers SET local_ip = $1, local_username = $2, local_password_encrypted = $3, verified = true WHERE user_id = $4 AND name = $5',
      [ip, username, encryptedPassword, userId, serverName]
    );
    console.log(`✅ Server already exists, credentials updated: ${serverName}`);
  } else {
    await db.query(
      "INSERT INTO proxmox_servers (user_id, name, mode, local_ip, local_username, local_password_encrypted, verified, last_sync) VALUES ($1, $2, 'local', $3, $4, $5, true, NOW())",
      [userId, serverName, ip, username, encryptedPassword]
    );
    console.log(`✅ Server added: ${serverName} (${ip})`);
  }

  console.log('\n📋 Test account:');
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
  console.log(`   Server   : ${serverName} — ${ip} (${username})`);

  await db.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
