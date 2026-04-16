import apiClient from './client';

export interface NodeStatus {
  node: string;
  status: {
    cpu: number;
    memory: { used: number; total: number; free: number };
    swap: { used: number; total: number; free: number };
    uptime: number;
    loadavg: number[];
    kversion: string;
    pveversion: string;
  };
  storage: Array<{
    storage: string;
    type: string;
    used: number;
    total: number;
    avail: number;
    enabled: boolean;
    active: boolean;
  }>;
}

export interface AptPackage {
  Package: string;
  Version: string;
  OldVersion: string;
  Priority: string;
  Section: string;
  Description: string;
}

export interface ClusterLogEntry {
  id: number;
  node: string;
  pid: number;
  uid: number;
  severity: string;
  tag: string;
  msg: string;
  t: number;
}

export const nodesApi = {
  getStatus: (serverId: string) =>
    apiClient.get<NodeStatus>(`/api/v1/servers/${serverId}/node/status`),

  getUpdates: (serverId: string) =>
    apiClient.get<{ node: string; updates: AptPackage[] }>(`/api/v1/servers/${serverId}/node/updates`),

  refreshUpdates: (serverId: string) =>
    apiClient.post(`/api/v1/servers/${serverId}/node/refresh-updates`),

  upgrade: (serverId: string) =>
    apiClient.post(`/api/v1/servers/${serverId}/node/upgrade`, { confirmed: true }),

  getLogs: (serverId: string, max = 50) =>
    apiClient.get<{ logs: ClusterLogEntry[] }>(`/api/v1/servers/${serverId}/node/logs?max=${max}`),
};
