import { encryptString, decryptString, hashPassword, verifyPassword } from '../src/utils/encryption';

// Set up env vars for encryption
process.env.ENCRYPTION_KEY = 'test-key-exactly-32-chars-padded';

describe('encryptString / decryptString', () => {
  it('round-trips a simple string', () => {
    const original = 'my-secret-password';
    const encrypted = encryptString(original);
    expect(encrypted).not.toBe(original);
    expect(decryptString(encrypted)).toBe(original);
  });

  it('produces different ciphertext each call (random IV)', () => {
    const a = encryptString('hello');
    const b = encryptString('hello');
    expect(a).not.toBe(b);
  });

  it('round-trips special characters', () => {
    const original = 'p@$$w0rd!#%&*()';
    expect(decryptString(encryptString(original))).toBe(original);
  });

  it('round-trips a long string', () => {
    const original = 'a'.repeat(500);
    expect(decryptString(encryptString(original))).toBe(original);
  });
});

describe('hashPassword / verifyPassword', () => {
  it('hashes a password and verifies correctly', async () => {
    const password = 'MySecurePassword123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it('rejects incorrect password', async () => {
    const hash = await hashPassword('correct-password');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });
});
