import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// AES-256-CBC requires exactly 32 bytes key
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || '';
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }
  return Buffer.from(key.substring(0, 32));
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function encryptString(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptString(encrypted: string): string {
  const key = getEncryptionKey();
  const parts = encrypted.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted string format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
