import apiClient from './client';

export interface VMItem {
  vmid: number;
  name: string;
  status: 'running' | 'stopped' | 'paused' | string;
  type: 'qemu' | 'lxc';
  node: string;
  mem?: number;
  maxmem?: number;
  cpu?: number;
  maxcpu?: number;
  disk?: number;
  maxdisk?: number;
  uptime?: number;
}

export type VMAction = 'start' | 'stop' | 'restart';

export const vmsApi = {
  list: (serverId: string) =>
    apiClient.get<{ vms: VMItem[]; containers: VMItem[] }>(`/api/v1/servers/${serverId}/vms`),

  action: (serverId: string, vmid: number, action: VMAction, type: 'qemu' | 'lxc', node: string) =>
    apiClient.post(`/api/v1/servers/${serverId}/vms/${vmid}/action/${action}`, { type, node }),
};
