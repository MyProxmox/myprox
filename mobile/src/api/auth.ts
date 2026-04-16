import apiClient from './client';

export interface LoginResponse {
  user: { id: string; email: string; plan: string };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/api/v1/auth/login', { email, password }),

  register: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/api/v1/auth/register', { email, password }),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>('/api/v1/auth/refresh', { refreshToken }),

  logout: () =>
    apiClient.post('/api/v1/auth/logout'),

  getProfile: () =>
    apiClient.get<{ id: string; email: string; plan: string }>('/api/v1/user/profile'),
};
