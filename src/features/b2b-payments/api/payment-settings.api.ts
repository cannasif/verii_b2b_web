import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { PaymentSettingDto, UpsertPaymentSettingDto } from '../types/payment-settings.types';

function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || response.exceptionMessage || 'Request failed');
  }

  return response.data;
}

export const paymentSettingsApi = {
  async get(): Promise<PaymentSettingDto[]> {
    const response = await api.get<ApiResponse<PaymentSettingDto[]>>('/api/b2b/payment-settings');
    return extractData(response);
  },

  async update(providerKey: string, payload: UpsertPaymentSettingDto): Promise<PaymentSettingDto> {
    const response = await api.put<ApiResponse<PaymentSettingDto>>(`/api/b2b/payment-settings/${providerKey}`, payload);
    return extractData(response);
  },
};
