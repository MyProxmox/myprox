import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

export const redisClient = createClient({ url: REDIS_URL });

redisClient.on('error', (err: Error) => {
  console.error('Redis client error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis connected');
});

// Connect on startup (non-blocking)
redisClient.connect().catch((err: Error) => {
  console.warn('Redis connection failed (non-fatal):', err.message);
});

export default redisClient;
