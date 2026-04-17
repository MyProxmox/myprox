import { create } from 'zustand'
import api from './api'

export interface Server {
  id: string
  name: string
  host: string
  port?: number
  type: 'PVE' | 'PBS' | string
  mode?: 'local' | 'cloud' | string
  status?: 'online' | 'offline' | string
  node?: string
}

export interface VMItem {
  vmid: number
  name: string
  type: 'vm' | 'lxc'
  status: 'running' | 'stopped' | string
  node: string
  cpus?: number
  maxmem?: number
  mem?: number
  maxdisk?: number
  uptime?: number
}

export interface StorageStatus {
  storage: string
  type: string
  total: number
  used: number
  avail: number
  active: boolean
}

export interface NodeStatus {
  node: string
  status: {
    cpu: number
    memory: { total: number; used: number; free: number }
    swap: { total: number; used: number; free: number }
    uptime: number
    loadavg: number[]
  }
  storage: StorageStatus[]
}

export interface ClusterEvent {
  id?: string
  node: string
  user?: string
  description: string
  severity: 'info' | 'warning' | 'error' | string
  time: number
}

interface OpsStore {
  servers: Server[]
  vms: Record<string, VMItem[]>
  nodeStatuses: Record<string, NodeStatus>
  clusterEvents: ClusterEvent[]
  isLoadingServers: boolean
  isLoadingVMs: Record<string, boolean>
  isLoadingNodes: Record<string, boolean>
  apiOnline: boolean

  fetchServers: () => Promise<void>
  fetchVMs: (serverId: string) => Promise<void>
  fetchNodeStatus: (serverId: string) => Promise<void>
  fetchClusterEvents: (serverId: string) => Promise<void>
  setApiOnline: (online: boolean) => void
}

export const useOpsStore = create<OpsStore>((set, get) => ({
  servers: [],
  vms: {},
  nodeStatuses: {},
  clusterEvents: [],
  isLoadingServers: false,
  isLoadingVMs: {},
  isLoadingNodes: {},
  apiOnline: false,

  setApiOnline: (online: boolean) => set({ apiOnline: online }),

  fetchServers: async () => {
    set({ isLoadingServers: true })
    try {
      const response = await api.get('/api/v1/servers')
      const servers = response.data?.servers || response.data || []
      set({ servers, isLoadingServers: false, apiOnline: true })
    } catch {
      set({ isLoadingServers: false, apiOnline: false })
    }
  },

  fetchVMs: async (serverId: string) => {
    set((state) => ({
      isLoadingVMs: { ...state.isLoadingVMs, [serverId]: true },
    }))
    try {
      const response = await api.get(`/api/v1/servers/${serverId}/vms`)
      const data = response.data
      const vms: VMItem[] = [
        ...(data.vms || []).map((v: VMItem) => ({ ...v, type: 'vm' as const })),
        ...(data.containers || []).map((c: VMItem) => ({
          ...c,
          type: 'lxc' as const,
        })),
      ]
      set((state) => ({
        vms: { ...state.vms, [serverId]: vms },
        isLoadingVMs: { ...state.isLoadingVMs, [serverId]: false },
      }))
    } catch {
      set((state) => ({
        isLoadingVMs: { ...state.isLoadingVMs, [serverId]: false },
      }))
    }
  },

  fetchNodeStatus: async (serverId: string) => {
    set((state) => ({
      isLoadingNodes: { ...state.isLoadingNodes, [serverId]: true },
    }))
    try {
      const response = await api.get(
        `/api/v1/servers/${serverId}/node/status`
      )
      const nodeStatus: NodeStatus = response.data
      set((state) => ({
        nodeStatuses: { ...state.nodeStatuses, [serverId]: nodeStatus },
        isLoadingNodes: { ...state.isLoadingNodes, [serverId]: false },
        apiOnline: true,
      }))
    } catch {
      set((state) => ({
        isLoadingNodes: { ...state.isLoadingNodes, [serverId]: false },
      }))
    }
  },

  fetchClusterEvents: async (serverId: string) => {
    try {
      const response = await api.get(
        `/api/v1/servers/${serverId}/node/cluster/logs`
      )
      const events: ClusterEvent[] =
        response.data?.logs || response.data || []
      set({ clusterEvents: events.slice(0, 10) })
    } catch {
      // Silently fail — cluster events are non-critical
    }
  },
}))
