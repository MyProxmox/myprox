import apiClient from './client';

export interface Server {
  id: string;
  name: string;
  mode: 'local' | 'cloud';
  local_ip: string;
  local_username: string;
  verified: boolean;
  last_sync: string | null;
}

export const serversApi = {
  list: () =>
    apiClient.get<Server[]>('/api/v1/servers'),

  add: (data: { name: string; ip: string; username: string; password: string; mode?: 'local' | 'cloud' }) =>
    apiClient.post<{ server: Server; agentToken?: string; message: string }>('/api/v1/servers', data),

  delete: (id: string) =>
    apiClient.delete(`/api/v1/servers/${id}`),
};
