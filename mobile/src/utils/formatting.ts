/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format CPU usage percentage
 */
export function formatCPU(cpu: number): string {
  return `${(cpu * 100).toFixed(1)}%`;
}

/**
 * Format RAM usage : used / total
 */
export function formatRAM(used: number, total: number): string {
  if (!total) return '-';
  const pct = ((used / total) * 100).toFixed(0);
  return `${formatBytes(used)} / ${formatBytes(total)} (${pct}%)`;
}

/**
 * Format uptime in seconds to human-readable
 */
export function formatUptime(seconds: number): string {
  if (!seconds) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    running: '#4CAF50',
    stopped: '#f44336',
    paused: '#FF9800',
  };
  return map[status] ?? '#999';
}

/**
 * Get a color based on CPU usage (0–1 float)
 * Green < 60% | Orange < 85% | Red ≥ 85%
 */
export function getCPUColor(cpu: number): string {
  const pct = cpu * 100;
  if (pct >= 85) return '#f44336';
  if (pct >= 60) return '#FF9800';
  return '#4CAF50';
}

/**
 * Get a color based on RAM usage (used / max)
 * Green < 60% | Orange < 85% | Red ≥ 85%
 */
export function getRAMColor(used: number, max: number): string {
  if (!max) return '#999';
  const pct = (used / max) * 100;
  if (pct >= 85) return '#f44336';
  if (pct >= 60) return '#FF9800';
  return '#4CAF50';
}

/**
 * Get CPU usage as a 0–1 clamped float for progress bars
 */
export function getCPUPercent(cpu: number): number {
  return Math.min(Math.max(cpu, 0), 1);
}

/**
 * Get RAM usage as a 0–1 clamped float for progress bars
 */
export function getRAMPercent(used: number, max: number): number {
  if (!max) return 0;
  return Math.min(Math.max(used / max, 0), 1);
}
