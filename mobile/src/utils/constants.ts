export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const REFRESH_INTERVAL_MS = 30_000; // 30 secondes

export const PLAN_LIMITS = {
  free: {
    localServers: 5,
    cloudServers: 1,
    bandwidthGB: 10,
  },
  premium: {
    localServers: Infinity,
    cloudServers: Infinity,
    bandwidthGB: Infinity,
  },
};

export const STATUS_COLORS = {
  running: '#4CAF50',
  stopped: '#f44336',
  paused: '#FF9800',
  unknown: '#999',
} as const;
