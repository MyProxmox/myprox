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

export interface RRDPoint {
  time: number;
  cpu?: number;
  mem?: number;
  maxmem?: number;
  diskread?: number;
  diskwrite?: number;
  netin?: number;
  netout?: number;
}

export const vmStatsApi = {
  get: (serverId: string, vmid: number, node: string, type = 'qemu', timeframe = 'hour') =>
    apiClient.get<{ stats: RRDPoint[] }>(
      `/api/v1/servers/${serverId}/vms/${vmid}/stats?node=${node}&type=${type}&timeframe=${timeframe}`
    ),
};

// ─── PBS API ─────────────────────────────────────────────────────────────────

export interface PBSDatastore {
  store: string;
  path: string;
  'disk-usage': number;
  'disk-quota': number;
  avail: number;
  total: number;
  used: number;
  comment?: string;
}

export interface PBSTask {
  upid: string;
  node: string;
  type: string;
  id: string;
  status: string;
  user: string;
  starttime: number;
  endtime?: number;
}

export interface PBSSnapshot {
  'backup-id': string;
  'backup-time': number;
  'backup-type': string;
  size?: number;
  comment?: string;
}

export const pbsApi = {
  getDatastores: (serverId: string) =>
    apiClient.get<{ datastores: PBSDatastore[] }>(`/api/v1/servers/${serverId}/pbs/datastores`),

  getDatastoreStatus: (serverId: string, store: string) =>
    apiClient.get(`/api/v1/servers/${serverId}/pbs/datastores/${store}/status`),

  getSnapshots: (serverId: string, store: string) =>
    apiClient.get<{ snapshots: PBSSnapshot[] }>(`/api/v1/servers/${serverId}/pbs/datastores/${store}/snapshots`),

  getTasks: (serverId: string, store?: string) =>
    apiClient.get<{ tasks: PBSTask[] }>(
      `/api/v1/servers/${serverId}/pbs/tasks${store ? `?store=${store}` : ''}`
    ),
};
