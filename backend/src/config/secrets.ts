/**
 * Validates that all required environment variables are present at startup.
 * Throws an error with a clear message if any required variable is missing.
 */

interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ENCRYPTION_KEY: string;
  PORT: number;
  NODE_ENV: string;
  REDIS_URL: string;
  RELAY_URL: string;
  API_RELAY_SECRET: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function validateSecrets(): EnvConfig {
  const errors: string[] = [];

  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      errors.push(key);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `\n❌ Missing required environment variables:\n${errors.map((e) => `  - ${e}`).join('\n')}\n\nCopy .env.example to .env and fill in the values.`
    );
  }

  // Warn about weak secrets in production
  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET || '';
    if (jwtSecret.length < 32) {
      console.warn('⚠️  JWT_SECRET should be at least 32 characters in production');
    }
    const encKey = process.env.ENCRYPTION_KEY || '';
    if (encKey.length !== 32) {
      console.warn('⚠️  ENCRYPTION_KEY must be exactly 32 characters for AES-256-CBC');
    }
  }

  return {
    DATABASE_URL: requireEnv('DATABASE_URL'),
    JWT_SECRET: requireEnv('JWT_SECRET'),
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    ENCRYPTION_KEY: requireEnv('ENCRYPTION_KEY'),
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    REDIS_URL: process.env.REDIS_URL || 'redis://redis:6379',
    RELAY_URL: process.env.RELAY_URL || 'http://relay:8080',
    API_RELAY_SECRET: process.env.API_RELAY_SECRET || '',
  };
}
