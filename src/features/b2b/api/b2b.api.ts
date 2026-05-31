import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type { UserDto } from '@/features/auth/types/auth';
import type {
  B2bIntegrationEventDto,
  B2bInsightSummaryDto,
  B2bPriceAvailabilityDto,
  B2bPortalSessionDto,
  B2bBuyerDto,
  B2bCompanyDto,
  CartDto,
  CatalogFavoriteToggleResultDto,
  CatalogProductDto,
  CatalogProductFavoriteDto,
  CatalogVisibilityRuleDto,
  ConvertQuoteToCartDto,
  CustomerPortalSummaryDto,
  CustomerPriceListDto,
  CustomerProductAliasDto,
  InventorySnapshotDto,
  MarketplaceCapabilityDto,
  MarketplaceChannelDto,
  MarketplaceListingDto,
  MarketplaceConnectionTestRequestDto,
  MarketplaceConnectionTestResultDto,
  MarketplaceProviderSettingDto,
  MarketplaceSyncEventDto,
  OrderDto,
  PaymentTransactionDto,
  PaymentBinLookupDto,
  PaymentBinLookupRequestDto,
  PaymentInstallmentOptionsDto,
  PaymentInstallmentOptionsRequestDto,
  PaymentOrderDto,
  CreatePaymentOrderDto,
  PaymentMethodOptionDto,
  CreateIyzico3dsPaymentDto,
  Iyzico3dsInitializeDto,
  CreatePaymentProviderOperationDto,
  PaymentProviderOperationDto,
  ResolvePaymentMethodsDto,
  SelectPaymentProviderInstallmentDto,
  CreatePaytrIframeTokenDto,
  PaytrIframeTokenDto,
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

const publicRequestConfig = { skipAuth: true, skipSessionExpiredOn401: true } as const;

function portalRequestConfig(token: string) {
  return {
    ...publicRequestConfig,
    headers: { 'X-B2B-Portal-Token': token },
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

  async getPublicCompanies(params: PagedParams = {}): Promise<PagedResponse<B2bCompanyDto>> {
    const response = await api.post<ApiResponse<PagedResponse<B2bCompanyDto>>>(
      '/api/b2b/companies/public-paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'CompanyName', sortDirection: 'asc' }),
      publicRequestConfig,
    );
    return normalizePaged(response);
  },

  async createPortalSession(companyCode: string, buyerEmail?: string): Promise<B2bPortalSessionDto> {
    const response = await api.post<ApiResponse<B2bPortalSessionDto>>(
      '/api/b2b/portal/session',
      { companyCode, buyerEmail },
      publicRequestConfig,
    );
    return extractData(response);
  },

  async getUsers(params: PagedParams = {}): Promise<PagedResponse<UserDto>> {
    const response = await api.post<ApiResponse<PagedResponse<UserDto>>>(
      '/api/User/paged',
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

  async getPublicCatalogProducts(params: PagedParams = {}, portalToken = ''): Promise<PagedResponse<CatalogProductDto>> {
    const response = await api.post<ApiResponse<PagedResponse<CatalogProductDto>>>(
      '/api/b2b/catalog/public-paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Name', sortDirection: 'asc' }),
      portalToken ? portalRequestConfig(portalToken) : publicRequestConfig,
    );
    return normalizePaged(response);
  },

  async getPublicCatalogProductFavorites(
    companyId: number,
    portalToken: string,
    params: PagedParams = {},
    buyerId?: number,
    userId?: number,
  ): Promise<PagedResponse<CatalogProductFavoriteDto>> {
    const response = await api.post<ApiResponse<PagedResponse<CatalogProductFavoriteDto>>>(
      '/api/b2b/catalog/favorites/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 100, sortBy: 'Id', sortDirection: 'desc' }),
      {
        ...portalRequestConfig(portalToken),
        params: { companyId, buyerId, userId },
      },
    );
    return normalizePaged(response);
  },

  async togglePublicCatalogProductFavorite(payload: Record<string, unknown>, portalToken: string): Promise<CatalogFavoriteToggleResultDto> {
    const response = await api.post<ApiResponse<CatalogFavoriteToggleResultDto>>(
      '/api/b2b/catalog/favorites/toggle',
      payload,
      portalRequestConfig(portalToken),
    );
    return extractData(response);
  },

  async getCatalogProduct(id: number): Promise<CatalogProductDto> {
    const response = await api.get<ApiResponse<CatalogProductDto>>(`/api/b2b/catalog/${id}`);
    return extractData(response);
  },

  async createCompany(payload: Record<string, unknown>): Promise<B2bCompanyDto> {
    const response = await api.post<ApiResponse<B2bCompanyDto>>('/api/b2b/companies', payload);
    return extractData(response);
  },

  async createBuyer(payload: Record<string, unknown>): Promise<B2bBuyerDto> {
    const response = await api.post<ApiResponse<B2bBuyerDto>>('/api/b2b/buyers', payload);
    return extractData(response);
  },

  async createCatalogProduct(payload: Record<string, unknown>): Promise<CatalogProductDto> {
    const response = await api.post<ApiResponse<CatalogProductDto>>('/api/b2b/catalog', payload);
    return extractData(response);
  },

  async updateCatalogProduct(id: number, payload: Record<string, unknown>): Promise<CatalogProductDto> {
    const response = await api.put<ApiResponse<CatalogProductDto>>(`/api/b2b/catalog/${id}`, payload);
    return extractData(response);
  },

  async getProductMatches(params: PagedParams = {}): Promise<PagedResponse<CustomerProductAliasDto>> {
    const response = await api.post<ApiResponse<PagedResponse<CustomerProductAliasDto>>>(
      '/api/b2b/product-matches/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async createProductMatch(payload: Record<string, unknown>): Promise<CustomerProductAliasDto> {
    const response = await api.post<ApiResponse<CustomerProductAliasDto>>('/api/b2b/product-matches', payload);
    return extractData(response);
  },

  async getVisibilityRules(params: PagedParams = {}): Promise<PagedResponse<CatalogVisibilityRuleDto>> {
    const response = await api.post<ApiResponse<PagedResponse<CatalogVisibilityRuleDto>>>(
      '/api/b2b/catalog-visibility/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async createVisibilityRule(payload: Record<string, unknown>): Promise<CatalogVisibilityRuleDto> {
    const response = await api.post<ApiResponse<CatalogVisibilityRuleDto>>('/api/b2b/catalog-visibility', payload);
    return extractData(response);
  },

  async getPriceLists(params: PagedParams = {}): Promise<PagedResponse<CustomerPriceListDto>> {
    const response = await api.post<ApiResponse<PagedResponse<CustomerPriceListDto>>>(
      '/api/b2b/pricing/price-lists/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async createPriceList(payload: Record<string, unknown>): Promise<CustomerPriceListDto> {
    const response = await api.post<ApiResponse<CustomerPriceListDto>>('/api/b2b/pricing/price-lists', payload);
    return extractData(response);
  },

  async getPriceList(id: number): Promise<CustomerPriceListDto> {
    const response = await api.get<ApiResponse<CustomerPriceListDto>>(`/api/b2b/pricing/price-lists/${id}`);
    return extractData(response);
  },

  async upsertPriceListItem(priceListId: number, payload: Record<string, unknown>): Promise<unknown> {
    const response = await api.post<ApiResponse<unknown>>(`/api/b2b/pricing/price-lists/${priceListId}/items`, payload);
    return extractData(response);
  },

  async resolvePriceAvailability(payload: ResolveB2bPriceAvailabilityDto): Promise<B2bPriceAvailabilityDto> {
    const response = await api.post<ApiResponse<B2bPriceAvailabilityDto>>('/api/b2b/pricing/resolve', payload);
    return extractData(response);
  },

  async publicResolvePriceAvailability(payload: ResolveB2bPriceAvailabilityDto, portalToken: string): Promise<B2bPriceAvailabilityDto> {
    const response = await api.post<ApiResponse<B2bPriceAvailabilityDto>>('/api/b2b/pricing/resolve', payload, portalRequestConfig(portalToken));
    return extractData(response);
  },

  async getInventory(params: PagedParams = {}): Promise<PagedResponse<InventorySnapshotDto>> {
    const response = await api.post<ApiResponse<PagedResponse<InventorySnapshotDto>>>(
      '/api/b2b/inventory/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'SnapshotDate', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async upsertInventory(payload: Record<string, unknown>): Promise<InventorySnapshotDto> {
    const response = await api.post<ApiResponse<InventorySnapshotDto>>('/api/b2b/inventory', payload);
    return extractData(response);
  },

  async getQuotes(params: PagedParams = {}): Promise<PagedResponse<QuoteRequestDto>> {
    const response = await api.post<ApiResponse<PagedResponse<QuoteRequestDto>>>(
      '/api/b2b/quotes/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getQuote(id: number): Promise<QuoteRequestDto> {
    const response = await api.get<ApiResponse<QuoteRequestDto>>(`/api/b2b/quotes/${id}`);
    return extractData(response);
  },

  async createQuote(payload: Record<string, unknown>): Promise<QuoteRequestDto> {
    const response = await api.post<ApiResponse<QuoteRequestDto>>('/api/b2b/quotes', payload);
    return extractData(response);
  },

  async createPublicQuote(payload: Record<string, unknown>, portalToken: string): Promise<QuoteRequestDto> {
    const response = await api.post<ApiResponse<QuoteRequestDto>>('/api/b2b/quotes', payload, portalRequestConfig(portalToken));
    return extractData(response);
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

  async createShoppingList(payload: Record<string, unknown>): Promise<ShoppingListDto> {
    const response = await api.post<ApiResponse<ShoppingListDto>>('/api/b2b/shopping-lists', payload);
    return extractData(response);
  },

  async getApprovalRules(params: PagedParams = {}): Promise<PagedResponse<PurchaseApprovalRuleDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PurchaseApprovalRuleDto>>>(
      '/api/b2b/approval-rules/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async createApprovalRule(payload: Record<string, unknown>): Promise<PurchaseApprovalRuleDto> {
    const response = await api.post<ApiResponse<PurchaseApprovalRuleDto>>('/api/b2b/approval-rules', payload);
    return extractData(response);
  },

  async getOrders(params: PagedParams = {}): Promise<PagedResponse<OrderDto>> {
    const response = await api.post<ApiResponse<PagedResponse<OrderDto>>>(
      '/api/b2b/orders/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getOrder(id: number): Promise<OrderDto> {
    const response = await api.get<ApiResponse<OrderDto>>(`/api/b2b/orders/${id}`);
    return extractData(response);
  },

  async quickOrder(payload: QuickOrderDto): Promise<QuickOrderResultDto> {
    const response = await api.post<ApiResponse<QuickOrderResultDto>>('/api/b2b/cart/quick-order', payload);
    return extractData(response);
  },

  async publicQuickOrder(payload: QuickOrderDto, portalToken: string): Promise<QuickOrderResultDto> {
    const response = await api.post<ApiResponse<QuickOrderResultDto>>('/api/b2b/cart/quick-order', payload, portalRequestConfig(portalToken));
    return extractData(response);
  },

  async getPublicDraftCart(customerId: number, portalToken: string, userId?: number): Promise<CartDto> {
    const response = await api.get<ApiResponse<CartDto>>(`/api/b2b/cart/draft/${customerId}`, {
      ...portalRequestConfig(portalToken),
      params: { userId },
    });
    return extractData(response);
  },

  async publicAddCartLine(payload: Record<string, unknown>, portalToken: string): Promise<CartDto> {
    const response = await api.post<ApiResponse<CartDto>>('/api/b2b/cart/lines', payload, portalRequestConfig(portalToken));
    return extractData(response);
  },

  async publicCreateOrderFromCart(payload: Record<string, unknown>, portalToken: string): Promise<OrderDto> {
    const response = await api.post<ApiResponse<OrderDto>>('/api/b2b/orders/from-cart', payload, portalRequestConfig(portalToken));
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

  async getPublicCustomerPortalSummary(customerId: number, portalToken: string, userId?: number): Promise<CustomerPortalSummaryDto> {
    const response = await api.get<ApiResponse<CustomerPortalSummaryDto>>(`/api/b2b/orders/portal/${customerId}`, {
      ...portalRequestConfig(portalToken),
      params: { userId },
    });
    return extractData(response);
  },

  async getPayments(params: PagedParams = {}): Promise<PagedResponse<PaymentTransactionDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PaymentTransactionDto>>>(
      '/api/b2b/payments/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getPaymentOrders(params: PagedParams = {}): Promise<PagedResponse<PaymentOrderDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PaymentOrderDto>>>(
      '/api/b2b/payments/orders/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async createPaymentOrder(payload: CreatePaymentOrderDto, portalToken?: string): Promise<PaymentOrderDto> {
    const response = await api.post<ApiResponse<PaymentOrderDto>>(
      '/api/b2b/payments/orders',
      payload,
      portalToken ? portalRequestConfig(portalToken) : undefined,
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

  async resolvePaymentMethods(payload: ResolvePaymentMethodsDto, portalToken?: string): Promise<PaymentMethodOptionDto[]> {
    const response = await api.post<ApiResponse<PaymentMethodOptionDto[]>>(
      '/api/b2b/payments/methods/resolve',
      payload,
      portalToken ? portalRequestConfig(portalToken) : undefined,
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

  async getPaymentInstallmentOptions(payload: PaymentInstallmentOptionsRequestDto, portalToken?: string): Promise<PaymentInstallmentOptionsDto> {
    const response = await api.post<ApiResponse<PaymentInstallmentOptionsDto>>(
      '/api/b2b/payments/providers/installments',
      payload,
      portalToken ? portalRequestConfig(portalToken) : undefined,
    );
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

  async getIntegrationEvents(params: PagedParams = {}): Promise<PagedResponse<B2bIntegrationEventDto>> {
    const response = await api.post<ApiResponse<PagedResponse<B2bIntegrationEventDto>>>(
      '/api/b2b/integration-events/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getMarketplaceCapabilities(): Promise<MarketplaceCapabilityDto[]> {
    const response = await api.get<ApiResponse<MarketplaceCapabilityDto[]>>('/api/b2b/marketplaces/capabilities');
    return extractData(response);
  },

  async getMarketplaceSettings(): Promise<MarketplaceProviderSettingDto[]> {
    const response = await api.get<ApiResponse<MarketplaceProviderSettingDto[]>>('/api/b2b/marketplaces/settings');
    return extractData(response);
  },

  async getMarketplaceChannels(params: PagedParams = {}): Promise<PagedResponse<MarketplaceChannelDto>> {
    const response = await api.post<ApiResponse<PagedResponse<MarketplaceChannelDto>>>(
      '/api/b2b/marketplaces/channels/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Name', sortDirection: 'asc' }),
    );
    return normalizePaged(response);
  },

  async createMarketplaceChannel(payload: Record<string, unknown>): Promise<MarketplaceChannelDto> {
    const response = await api.post<ApiResponse<MarketplaceChannelDto>>('/api/b2b/marketplaces/channels', payload);
    return extractData(response);
  },

  async updateMarketplaceChannel(id: number, payload: Record<string, unknown>): Promise<MarketplaceChannelDto> {
    const response = await api.put<ApiResponse<MarketplaceChannelDto>>(`/api/b2b/marketplaces/channels/${id}`, payload);
    return extractData(response);
  },

  async getMarketplaceListings(params: PagedParams = {}): Promise<PagedResponse<MarketplaceListingDto>> {
    const response = await api.post<ApiResponse<PagedResponse<MarketplaceListingDto>>>(
      '/api/b2b/marketplaces/listings/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async upsertMarketplaceListing(payload: Record<string, unknown>): Promise<MarketplaceListingDto> {
    const response = await api.post<ApiResponse<MarketplaceListingDto>>('/api/b2b/marketplaces/listings', payload);
    return extractData(response);
  },

  async getMarketplaceSyncEvents(params: PagedParams = {}): Promise<PagedResponse<MarketplaceSyncEventDto>> {
    const response = await api.post<ApiResponse<PagedResponse<MarketplaceSyncEventDto>>>(
      '/api/b2b/marketplaces/sync-events/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'RequestedDate', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async queueMarketplaceProviderOperation(provider: string, operation: 'product-create' | 'price-update' | 'stock-update' | 'order-import', payload: Record<string, unknown>): Promise<MarketplaceSyncEventDto> {
    const route = normalizeProviderRoute(provider);
    const response = await api.post<ApiResponse<MarketplaceSyncEventDto>>(`/api/b2b/marketplaces/${route}/${operation}`, payload);
    return extractData(response);
  },

  async testMarketplaceConnection(payload: MarketplaceConnectionTestRequestDto): Promise<MarketplaceConnectionTestResultDto> {
    const response = await api.post<ApiResponse<MarketplaceConnectionTestResultDto>>('/api/b2b/marketplaces/connection-test', payload);
    return extractData(response);
  },
};

function normalizeProviderRoute(providerKey: string): string {
  const routeMap: Record<string, string> = {
    AdobeCommerce: 'adobe-commerce',
    Ciceksepeti: 'ciceksepeti',
    PttAvm: 'pttavm',
    WooCommerce: 'woocommerce',
  };

  if (routeMap[providerKey]) {
    return routeMap[providerKey];
  }

  return providerKey
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/([A-Z])/g, '-$1')
    .replace(/^-/, '')
    .toLowerCase();
}
