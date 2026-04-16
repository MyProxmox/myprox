import { create } from 'zustand';
import { serversApi, Server } from '../api/servers';
import { nodesApi } from '../api/nodes';

interface ServerState {
  servers: Server[];
  loading: boolean;
  offlineServers: Set<string>;
  fetchServers: () => Promise<void>;
  checkOnlineStatus: () => Promise<void>;
  addServer: (name: string, ip: string, username: string, password: string, mode?: 'local' | 'cloud', server_type?: 'pve' | 'pbs') => Promise<string | undefined>;
  deleteServer: (id: string) => Promise<void>;
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  loading: false,
  offlineServers: new Set(),

  fetchServers: async () => {
    try {
      set({ loading: true });
      const response = await serversApi.list();
      set({ servers: response.data });
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    } finally {
      set({ loading: false });
    }
  },

  checkOnlineStatus: async () => {
    const { servers } = get();
    if (!servers.length) return;

    const results = await Promise.allSettled(
      servers.map((s) => nodesApi.getStatus(s.id))
    );

    const offline = new Set<string>();
    results.forEach((result, i) => {
      if (result.status === 'rejected') offline.add(servers[i].id);
    });
    set({ offlineServers: offline });
  },

  addServer: async (name, ip, username, password, mode = 'local', server_type = 'pve') => {
    const response = await serversApi.add({ name, ip, username, password, mode, server_type });
    set((state) => ({ servers: [...state.servers, response.data.server] }));
    return response.data.agentToken;
  },

  deleteServer: async (id) => {
    await serversApi.delete(id);
    set((state) => ({
      servers: state.servers.filter((s) => s.id !== id),
      offlineServers: new Set([...state.offlineServers].filter((sid) => sid !== id)),
    }));
  },
}));
