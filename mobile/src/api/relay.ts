import apiClient from './client';

export interface RelayStatus {
  mode: 'local' | 'cloud';
  connected: boolean;
}

export const relayApi = {
  getStatus: (serverId: string) =>
    apiClient.get<RelayStatus>(`/api/v1/cloud/relay-status/${serverId}`),

  regenerateToken: (serverId: string) =>
    apiClient.post<{ agentToken: string }>(`/api/v1/cloud/regenerate-token/${serverId}`),
};
