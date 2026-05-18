import { api } from '@/lib/axios';
import { extractData } from '../utils/extract-api-data';
import type { ApiResponse } from '../types/access-control.types';
import type { MyPermissionsDto } from '../types/access-control.types';

export const authAccessApi = {
  getMyPermissions: async (platform: 'web' | 'mobile' = 'web'): Promise<MyPermissionsDto> => {
    const response = await api.get<ApiResponse<MyPermissionsDto>>('/api/auth/me/permissions', {
      params: { platform },
    });
    return extractData(response as ApiResponse<MyPermissionsDto>);
  },
};
