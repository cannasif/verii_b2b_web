import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import { extractData } from '../utils/extract-api-data';
import type {
  ApiResponse,
  CreateUserManagementDto,
  PagedRequest,
  PagedResponse,
  UpdateUserManagementDto,
  UserAuthorityDto,
  UserManagementDto,
} from '../types/access-control.types';

function normalizePaged<T>(response: ApiResponse<PagedResponse<T>>): PagedResponse<T> {
  const data = extractData(response);
  const rawData = data as unknown as { items?: T[]; data?: T[] };
  if (rawData.items && !rawData.data) {
    return { ...data, data: rawData.items };
  }

  return data;
}

export const userManagementApi = {
  getList: async (params: PagedRequest): Promise<PagedResponse<UserManagementDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<UserManagementDto>>>(
      '/api/User/paged',
      buildPagedRequest(params, {
        pageNumber: 0,
        pageSize: 20,
        sortBy: 'UpdatedDate',
        sortDirection: 'desc',
      }),
    );
    return normalizePaged(response as ApiResponse<PagedResponse<UserManagementDto>>);
  },

  getById: async (id: number): Promise<UserManagementDto> => {
    const response = await api.get<ApiResponse<UserManagementDto>>(`/api/User/${id}`);
    return extractData(response as ApiResponse<UserManagementDto>);
  },

  getRoles: async (): Promise<UserAuthorityDto[]> => {
    const response = await api.post<ApiResponse<PagedResponse<UserAuthorityDto>>>(
      '/api/UserAuthority/paged',
      buildPagedRequest({ pageNumber: 0, pageSize: 100, sortBy: 'Title', sortDirection: 'asc' }),
    );
    return normalizePaged(response as ApiResponse<PagedResponse<UserAuthorityDto>>).data;
  },

  create: async (dto: CreateUserManagementDto): Promise<UserManagementDto> => {
    const response = await api.post<ApiResponse<UserManagementDto>>('/api/User', dto);
    return extractData(response as ApiResponse<UserManagementDto>);
  },

  update: async (id: number, dto: UpdateUserManagementDto): Promise<UserManagementDto> => {
    const response = await api.put<ApiResponse<UserManagementDto>>(`/api/User/${id}`, dto);
    return extractData(response as ApiResponse<UserManagementDto>);
  },

  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<object>>(`/api/User/${id}`);
    if (!(response as ApiResponse<object>).success) {
      throw new Error((response as ApiResponse<object>).message || 'Kullanıcı silinemedi.');
    }
  },
};
