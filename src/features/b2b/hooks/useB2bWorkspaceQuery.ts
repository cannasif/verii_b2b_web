import { useQuery } from '@tanstack/react-query';
import type { PagedParams, PagedResponse } from '@/types/api';
import { b2bApi } from '../api/b2b.api';
import type {
  B2bIntegrationEventDto,
  B2bBuyerDto,
  B2bCompanyDto,
  B2bWorkspaceKind,
  CatalogProductDto,
  CatalogVisibilityRuleDto,
  CustomerPriceListDto,
  CustomerProductAliasDto,
  InventorySnapshotDto,
  MarketplaceChannelDto,
  MarketplaceListingDto,
  MarketplaceSyncEventDto,
  OrderDto,
  PaymentProviderOperationDto,
  PaymentTransactionDto,
  PurchaseApprovalRuleDto,
  QuoteRequestDto,
  ShoppingListDto,
} from '../types/b2b.types';

type WorkspaceRow =
  | B2bCompanyDto
  | B2bBuyerDto
  | CatalogProductDto
  | CustomerProductAliasDto
  | CatalogVisibilityRuleDto
  | CustomerPriceListDto
  | InventorySnapshotDto
  | ShoppingListDto
  | PurchaseApprovalRuleDto
  | QuoteRequestDto
  | OrderDto
  | PaymentTransactionDto
  | PaymentProviderOperationDto
  | MarketplaceChannelDto
  | MarketplaceListingDto
  | MarketplaceSyncEventDto
  | B2bIntegrationEventDto;

export function useB2bWorkspaceQuery(kind: B2bWorkspaceKind, params: PagedParams = {}) {
  return useQuery<PagedResponse<WorkspaceRow>>({
    queryKey: ['b2b-workspace', kind, params],
    queryFn: async () => {
      switch (kind) {
        case 'insights':
          return {
            data: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 20,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          };
        case 'companies':
          return b2bApi.getCompanies(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'buyers':
          return b2bApi.getBuyers(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'catalog':
          return b2bApi.getCatalogProducts(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'matches':
          return b2bApi.getProductMatches(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'visibility':
          return b2bApi.getVisibilityRules(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'pricing':
          return b2bApi.getPriceLists(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'inventory':
          return b2bApi.getInventory(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'quotes':
          return b2bApi.getQuotes(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'shopping-lists':
          return b2bApi.getShoppingLists(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'approval-rules':
          return b2bApi.getApprovalRules(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'orders':
          return b2bApi.getOrders(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'payments':
          return b2bApi.getPayments(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'payment-operations':
          return b2bApi.getPaymentProviderOperations(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'marketplace-channels':
          return b2bApi.getMarketplaceChannels(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'marketplace-listings':
          return b2bApi.getMarketplaceListings(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'marketplace-events':
          return b2bApi.getMarketplaceSyncEvents(params) as Promise<PagedResponse<WorkspaceRow>>;
        case 'integrations':
          return b2bApi.getIntegrationEvents(params) as Promise<PagedResponse<WorkspaceRow>>;
      }
    },
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}
