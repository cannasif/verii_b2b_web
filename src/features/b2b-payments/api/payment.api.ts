import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  CreateIyzico3dsPaymentDto,
  CreatePaymentOrderDto,
  CreatePartialPaymentAllocationDto,
  CreatePaymentProviderOperationDto,
  CreatePaytrIframeTokenDto,
  GeneratePaymentOrderLinkDto,
  Iyzico3dsInitializeDto,
  PaymentBinLookupDto,
  PaymentBinLookupRequestDto,
  PaymentInstallmentOptionsDto,
  PaymentInstallmentOptionsRequestDto,
  PaymentFinanceDashboardDto,
  PaymentMethodOptionDto,
  PaymentErpPostingDto,
  PaymentOrderDto,
  PaymentProviderReadinessDto,
  PaymentProviderOperationDto,
  PaymentTransactionDto,
  PaytrIframeTokenDto,
  ResolvePaymentMethodsDto,
  SelectPaymentProviderInstallmentDto,
} from '../types/payment.types';

function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || response.exceptionMessage || 'Request failed');
  }

  return response.data;
}

function normalizePaged<T>(response: ApiResponse<PagedResponse<T>>): PagedResponse<T> {
  return extractData(response) ?? {
    data: [],
    totalCount: 0,
    pageNumber: 1,
    pageSize: 20,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

const publicRequestConfig = { skipAuth: true, skipSessionExpiredOn401: true } as const;

function portalRequestConfig(token: string) {
  return {
    ...publicRequestConfig,
    headers: { 'X-B2B-Portal-Token': token },
  };
}

export const paymentApi = {
  async getPayments(params: PagedParams = {}): Promise<PagedResponse<PaymentTransactionDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PaymentTransactionDto>>>(
      '/api/b2b/payments/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getFinanceDashboard(): Promise<PaymentFinanceDashboardDto> {
    const response = await api.get<ApiResponse<PaymentFinanceDashboardDto>>('/api/b2b/payments/finance-dashboard');
    return extractData(response);
  },

  async getPaymentOrders(params: PagedParams = {}): Promise<PagedResponse<PaymentOrderDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PaymentOrderDto>>>(
      '/api/b2b/payments/orders/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getPaymentOrderByLinkToken(token: string): Promise<PaymentOrderDto> {
    const response = await api.get<ApiResponse<PaymentOrderDto>>(
      `/api/b2b/payments/orders/link/${encodeURIComponent(token)}`,
      publicRequestConfig,
    );
    return extractData(response);
  },

  async createPaymentOrder(payload: CreatePaymentOrderDto, portalToken?: string): Promise<PaymentOrderDto> {
    const response = await api.post<ApiResponse<PaymentOrderDto>>(
      '/api/b2b/payments/orders',
      payload,
      portalToken ? portalRequestConfig(portalToken) : undefined,
    );
    return extractData(response);
  },

  async generatePaymentOrderLink(paymentOrderId: number, payload: GeneratePaymentOrderLinkDto): Promise<PaymentOrderDto> {
    const response = await api.post<ApiResponse<PaymentOrderDto>>(
      `/api/b2b/payments/orders/${paymentOrderId}/payment-link`,
      payload,
    );
    return extractData(response);
  },

  async selectPaymentProviderInstallment(paymentOrderId: number, payload: SelectPaymentProviderInstallmentDto, portalToken?: string): Promise<PaymentOrderDto> {
    const response = await api.put<ApiResponse<PaymentOrderDto>>(
      `/api/b2b/payments/orders/${paymentOrderId}/provider-installment`,
      payload,
      portalToken ? portalRequestConfig(portalToken) : undefined,
    );
    return extractData(response);
  },

  async selectPaymentProviderInstallmentByLinkToken(paymentLinkToken: string, payload: SelectPaymentProviderInstallmentDto): Promise<PaymentOrderDto> {
    const response = await api.put<ApiResponse<PaymentOrderDto>>(
      `/api/b2b/payments/orders/link/${encodeURIComponent(paymentLinkToken)}/provider-installment`,
      payload,
      publicRequestConfig,
    );
    return extractData(response);
  },

  async resolvePaymentMethods(payload: ResolvePaymentMethodsDto, portalToken?: string): Promise<PaymentMethodOptionDto[]> {
    const response = await api.post<ApiResponse<PaymentMethodOptionDto[]>>(
      '/api/b2b/payments/methods/resolve',
      payload,
      portalToken ? portalRequestConfig(portalToken) : undefined,
    );
    return extractData(response);
  },

  async resolvePaymentMethodsByLinkToken(paymentLinkToken: string): Promise<PaymentMethodOptionDto[]> {
    const response = await api.post<ApiResponse<PaymentMethodOptionDto[]>>(
      `/api/b2b/payments/orders/link/${encodeURIComponent(paymentLinkToken)}/methods/resolve`,
      {},
      publicRequestConfig,
    );
    return extractData(response);
  },

  async createPayment(payload: Record<string, unknown>): Promise<PaymentTransactionDto> {
    const response = await api.post<ApiResponse<PaymentTransactionDto>>('/api/b2b/payments', payload);
    return extractData(response);
  },

  async lookupPaymentBin(payload: PaymentBinLookupRequestDto, portalToken?: string): Promise<PaymentBinLookupDto> {
    const response = await api.post<ApiResponse<PaymentBinLookupDto>>(
      '/api/b2b/payments/providers/bin-lookup',
      payload,
      portalToken ? portalRequestConfig(portalToken) : undefined,
    );
    return extractData(response);
  },

  async lookupPaymentBinByLinkToken(paymentLinkToken: string, payload: PaymentBinLookupRequestDto): Promise<PaymentBinLookupDto> {
    const response = await api.post<ApiResponse<PaymentBinLookupDto>>(
      `/api/b2b/payments/providers/link/${encodeURIComponent(paymentLinkToken)}/bin-lookup`,
      payload,
      publicRequestConfig,
    );
    return extractData(response);
  },

  async getPaymentInstallmentOptions(payload: PaymentInstallmentOptionsRequestDto, portalToken?: string): Promise<PaymentInstallmentOptionsDto> {
    const response = await api.post<ApiResponse<PaymentInstallmentOptionsDto>>(
      '/api/b2b/payments/providers/installments',
      payload,
      portalToken ? portalRequestConfig(portalToken) : undefined,
    );
    return extractData(response);
  },

  async getPaymentInstallmentOptionsByLinkToken(paymentLinkToken: string, payload: PaymentInstallmentOptionsRequestDto): Promise<PaymentInstallmentOptionsDto> {
    const response = await api.post<ApiResponse<PaymentInstallmentOptionsDto>>(
      `/api/b2b/payments/providers/link/${encodeURIComponent(paymentLinkToken)}/installments`,
      payload,
      publicRequestConfig,
    );
    return extractData(response);
  },

  async getProviderReadiness(): Promise<PaymentProviderReadinessDto[]> {
    const response = await api.get<ApiResponse<PaymentProviderReadinessDto[]>>('/api/b2b/payments/providers/readiness');
    return extractData(response);
  },

  async createPaytrIframeToken(payload: CreatePaytrIframeTokenDto, portalToken?: string): Promise<PaytrIframeTokenDto> {
    const response = await api.post<ApiResponse<PaytrIframeTokenDto>>(
      '/api/b2b/payments/paytr/iframe-token',
      payload,
      portalToken ? portalRequestConfig(portalToken) : undefined,
    );
    return extractData(response);
  },

  async createIyzico3dsPayment(payload: CreateIyzico3dsPaymentDto, portalToken?: string): Promise<Iyzico3dsInitializeDto> {
    const response = await api.post<ApiResponse<Iyzico3dsInitializeDto>>(
      '/api/b2b/payments/iyzico/3ds/initialize',
      payload,
      portalToken ? portalRequestConfig(portalToken) : undefined,
    );
    return extractData(response);
  },

  async getPaymentProviderOperations(params: PagedParams = {}): Promise<PagedResponse<PaymentProviderOperationDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PaymentProviderOperationDto>>>(
      '/api/b2b/payments/operations/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async createPaymentProviderOperation(payload: CreatePaymentProviderOperationDto): Promise<PaymentProviderOperationDto> {
    const response = await api.post<ApiResponse<PaymentProviderOperationDto>>('/api/b2b/payments/operations', payload);
    return extractData(response);
  },

  async executePaymentProviderOperation(operationId: number): Promise<PaymentProviderOperationDto> {
    const response = await api.post<ApiResponse<PaymentProviderOperationDto>>(`/api/b2b/payments/operations/${operationId}/execute`, {});
    return extractData(response);
  },

  async applyPartialCollection(paymentOrderId: number, payload: CreatePartialPaymentAllocationDto): Promise<PaymentOrderDto> {
    const response = await api.post<ApiResponse<PaymentOrderDto>>(
      `/api/b2b/payments/orders/${paymentOrderId}/partial-collections`,
      payload,
    );
    return extractData(response);
  },

  async getPaymentErpPostings(params: PagedParams = {}): Promise<PagedResponse<PaymentErpPostingDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PaymentErpPostingDto>>>(
      '/api/b2b/payments/erp-postings/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async executePaymentErpPosting(postingId: number): Promise<PaymentErpPostingDto> {
    const response = await api.post<ApiResponse<PaymentErpPostingDto>>(`/api/b2b/payments/erp-postings/${postingId}/execute`, {});
    return extractData(response);
  },

  async executePendingPaymentErpPostings(retryFailedOnly = false): Promise<number> {
    const response = await api.post<ApiResponse<number>>('/api/b2b/payments/erp-postings/execute-pending', { retryFailedOnly });
    return extractData(response);
  },
};
