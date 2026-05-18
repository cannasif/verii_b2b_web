import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  B2bIntegrationEventDto,
  B2bInsightSummaryDto,
  B2bPriceAvailabilityDto,
  B2bBuyerDto,
  B2bCompanyDto,
  CartDto,
  CatalogProductDto,
  CatalogVisibilityRuleDto,
  ConvertQuoteToCartDto,
  CustomerPortalSummaryDto,
  CustomerPriceListDto,
  CustomerProductAliasDto,
  InventorySnapshotDto,
  OrderDto,
  PaymentTransactionDto,
  PurchaseApprovalRuleDto,
  QuickOrderDto,
  QuickOrderResultDto,
  QuoteRequestDto,
  ReorderDto,
  ResolveB2bPriceAvailabilityDto,
  ShoppingListDto,
} from '../types/b2b.types';

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

export const b2bApi = {
  async getInsightSummary(): Promise<B2bInsightSummaryDto> {
    const response = await api.get<ApiResponse<B2bInsightSummaryDto>>('/api/b2b/insights/summary');
    return extractData(response);
  },

  async getCompanies(params: PagedParams = {}): Promise<PagedResponse<B2bCompanyDto>> {
    const response = await api.post<ApiResponse<PagedResponse<B2bCompanyDto>>>(
      '/api/b2b/companies/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getBuyers(params: PagedParams = {}): Promise<PagedResponse<B2bBuyerDto>> {
    const response = await api.post<ApiResponse<PagedResponse<B2bBuyerDto>>>(
      '/api/b2b/buyers/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getCatalogProducts(params: PagedParams = {}): Promise<PagedResponse<CatalogProductDto>> {
    const response = await api.post<ApiResponse<PagedResponse<CatalogProductDto>>>(
      '/api/b2b/catalog/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Name', sortDirection: 'asc' }),
    );
    return normalizePaged(response);
  },

  async getProductMatches(params: PagedParams = {}): Promise<PagedResponse<CustomerProductAliasDto>> {
    const response = await api.post<ApiResponse<PagedResponse<CustomerProductAliasDto>>>(
      '/api/b2b/product-matches/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getVisibilityRules(params: PagedParams = {}): Promise<PagedResponse<CatalogVisibilityRuleDto>> {
    const response = await api.post<ApiResponse<PagedResponse<CatalogVisibilityRuleDto>>>(
      '/api/b2b/catalog-visibility/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getPriceLists(params: PagedParams = {}): Promise<PagedResponse<CustomerPriceListDto>> {
    const response = await api.post<ApiResponse<PagedResponse<CustomerPriceListDto>>>(
      '/api/b2b/pricing/price-lists/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async resolvePriceAvailability(payload: ResolveB2bPriceAvailabilityDto): Promise<B2bPriceAvailabilityDto> {
    const response = await api.post<ApiResponse<B2bPriceAvailabilityDto>>('/api/b2b/pricing/resolve', payload);
    return extractData(response);
  },

  async getInventory(params: PagedParams = {}): Promise<PagedResponse<InventorySnapshotDto>> {
    const response = await api.post<ApiResponse<PagedResponse<InventorySnapshotDto>>>(
      '/api/b2b/inventory/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'SnapshotDate', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getQuotes(params: PagedParams = {}): Promise<PagedResponse<QuoteRequestDto>> {
    const response = await api.post<ApiResponse<PagedResponse<QuoteRequestDto>>>(
      '/api/b2b/quotes/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async convertQuoteToCart(quoteId: number, payload: ConvertQuoteToCartDto = {}): Promise<CartDto> {
    const response = await api.post<ApiResponse<CartDto>>(`/api/b2b/quotes/${quoteId}/convert-to-cart`, payload);
    return extractData(response);
  },

  async getShoppingLists(params: PagedParams = {}): Promise<PagedResponse<ShoppingListDto>> {
    const response = await api.post<ApiResponse<PagedResponse<ShoppingListDto>>>(
      '/api/b2b/shopping-lists/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getApprovalRules(params: PagedParams = {}): Promise<PagedResponse<PurchaseApprovalRuleDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PurchaseApprovalRuleDto>>>(
      '/api/b2b/approval-rules/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getOrders(params: PagedParams = {}): Promise<PagedResponse<OrderDto>> {
    const response = await api.post<ApiResponse<PagedResponse<OrderDto>>>(
      '/api/b2b/orders/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async quickOrder(payload: QuickOrderDto): Promise<QuickOrderResultDto> {
    const response = await api.post<ApiResponse<QuickOrderResultDto>>('/api/b2b/cart/quick-order', payload);
    return extractData(response);
  },

  async reorder(payload: ReorderDto): Promise<QuickOrderResultDto> {
    const response = await api.post<ApiResponse<QuickOrderResultDto>>('/api/b2b/orders/reorder', payload);
    return extractData(response);
  },

  async getCustomerPortalSummary(customerId: number, userId?: number): Promise<CustomerPortalSummaryDto> {
    const response = await api.get<ApiResponse<CustomerPortalSummaryDto>>(`/api/b2b/orders/portal/${customerId}`, { params: { userId } });
    return extractData(response);
  },

  async getPayments(params: PagedParams = {}): Promise<PagedResponse<PaymentTransactionDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PaymentTransactionDto>>>(
      '/api/b2b/payments/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getIntegrationEvents(params: PagedParams = {}): Promise<PagedResponse<B2bIntegrationEventDto>> {
    const response = await api.post<ApiResponse<PagedResponse<B2bIntegrationEventDto>>>(
      '/api/b2b/integration-events/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },
};
