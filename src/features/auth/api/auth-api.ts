import { api } from '@/lib/axios';
import type { LoginRequest, LoginResponse, ActiveUsersResponse } from '../types/auth';
import type { ApiResponse } from '@/types/api';
import type { ApiRequestOptions } from '@/lib/request-utils';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(
      '/api/auth/login',
      {
        email: data.email,
        password: data.password,
      },
      { skipSessionExpiredOn401: true },
    );
    return response;
  },
  register: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/register', {
      email: data.email,
      password: data.password,
    });
    return response;
  },
  getActiveUsers: async (options?: ApiRequestOptions): Promise<ActiveUsersResponse> => {
    const response = await api.get<ActiveUsersResponse>('/api/auth/users/active', options);
    return response;
  },
  requestPasswordReset: async (email: string): Promise<ApiResponse<string>> => {
    const response = await api.post<ApiResponse<string>>('/api/auth/forgot-password', {
      email,
    });
    return response;
  },
  resetPassword: async (data: { token: string; newPassword: string }): Promise<ApiResponse<boolean>> => {
    const response = await api.post<ApiResponse<boolean>>('/api/auth/reset-password', {
      token: data.token,
      newPassword: data.newPassword,
    });
    return response;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<string>> => {
    const response = await api.post<ApiResponse<string>>('/api/auth/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return response;
  },
};
