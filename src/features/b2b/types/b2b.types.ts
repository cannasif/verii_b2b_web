export type B2bWorkspaceKind =
  | 'insights'
  | 'companies'
  | 'buyers'
  | 'catalog'
  | 'matches'
  | 'visibility'
  | 'pricing'
  | 'inventory'
  | 'shopping-lists'
  | 'approval-rules'
  | 'quotes'
  | 'orders'
  | 'payments'
  | 'integrations';

export interface CatalogProductDto {
  id: number;
  sku: string;
  name: string;
  slug?: string;
  brand?: string;
  categoryPath?: string;
  description?: string;
  primaryImageUrl?: string;
  isPublished: boolean;
  defaultStockId?: number;
  variants?: CatalogVariantDto[];
}

export interface CatalogVariantDto {
  id: number;
  catalogProductId: number;
  erpStockId?: number;
  variantSku: string;
  variantName: string;
  isActive: boolean;
}

export interface CustomerProductAliasDto {
  id: number;
  customerId: number;
  erpStockId?: number;
  catalogProductId?: number;
  customerSku: string;
  customerProductName?: string;
  matchStatus: string;
  confidenceScore?: number;
}

export interface OrderDto {
  id: number;
  orderNumber: string;
  customerId: number;
  buyerId?: number;
  userId?: number;
  status: string;
  currencyCode: string;
  offerType?: string;
  offerDate?: string;
  offerNo?: string;
  revisionNo?: string;
  revisionId?: number;
  validUntil?: string;
  deliveryDate?: string;
  deliveryMethod?: string;
  paymentTypeId?: number;
  quoteRequestId?: number;
  erpProjectCode?: string;
  generalDiscountRate?: number;
  generalDiscountAmount?: number;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  description?: string;
  externalErpOrderNumber?: string;
  submittedDate?: string;
  lines?: OrderLineDto[];
}

export interface OrderLineDto {
  id: number;
  orderId: number;
  catalogProductId?: number;
  catalogVariantId?: number;
  erpStockId?: number;
  warehouseCode?: number;
  productSku?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discountRate1?: number;
  discountAmount1?: number;
  discountRate2?: number;
  discountAmount2?: number;
  discountRate3?: number;
  discountAmount3?: number;
  vatRate?: number;
  vatAmount?: number;
  lineTotal: number;
  lineGrandTotal?: number;
  priceSource?: string;
  priceListId?: number;
  exchangeRate?: number;
  priceResolvedAt?: string;
  description?: string;
  description1?: string;
  description2?: string;
  description3?: string;
  pricingRuleHeaderId?: number;
  relatedProductKey?: string;
  isMainRelatedProduct?: boolean;
  erpProjectCode?: string;
}

export interface CartDto {
  id: number;
  customerId: number;
  buyerId?: number;
  userId?: number;
  status: string;
  currencyCode: string;
  lines: CartLineDto[];
}

export interface CartLineDto {
  id: number;
  cartId: number;
  catalogProductId?: number;
  catalogVariantId?: number;
  erpStockId?: number;
  warehouseCode?: number;
  quantity: number;
  unitPrice: number;
  currencyCode: string;
  priceSource?: string;
  priceListId?: number;
  discountRate?: number;
  vatRate?: number;
  vatAmount?: number;
  exchangeRate?: number;
  priceResolvedAt?: string;
}

export interface QuickOrderLineDto {
  customerSku?: string;
  catalogProductId?: number;
  catalogVariantId?: number;
  erpStockId?: number;
  warehouseCode?: number;
  quantity: number;
}

export interface QuickOrderDto {
  customerId: number;
  buyerId?: number;
  userId?: number;
  customerGroupCode?: string;
  currencyCode?: string;
  allowBackorder?: boolean;
  lines: QuickOrderLineDto[];
}

export interface QuickOrderLineResultDto {
  lineNumber: number;
  customerSku?: string;
  catalogProductId?: number;
  catalogVariantId?: number;
  erpStockId?: number;
  quantity: number;
  success: boolean;
  message: string;
}

export interface QuickOrderResultDto {
  cart?: CartDto;
  requestedLineCount: number;
  addedLineCount: number;
  lines: QuickOrderLineResultDto[];
}

export interface ReorderDto {
  orderId: number;
  userId?: number;
  allowBackorder?: boolean;
}

export interface CustomerPortalSummaryDto {
  customerId: number;
  draftCartCount: number;
  orderCount: number;
  openOrderCount: number;
  quoteCount: number;
  pendingQuoteCount: number;
  pendingPaymentCount: number;
  openOrderTotal: number;
  pendingPaymentTotal: number;
  currencyCode: string;
  draftCart?: CartDto;
  recentOrders: OrderDto[];
  pendingPayments: PaymentTransactionDto[];
}

export interface PaymentTransactionDto {
  id: number;
  orderId: number;
  providerKey: string;
  externalTransactionId?: string;
  status: string;
  amount: number;
  currencyCode: string;
  paymentMethod?: string;
  requestedDate?: string;
  completedDate?: string;
}

export interface CreatePaytrIframeTokenDto {
  orderId: number;
  email: string;
  userName: string;
  userAddress: string;
  userPhone: string;
  okUrl?: string;
  failUrl?: string;
  userIp?: string;
}

export interface PaytrIframeTokenDto {
  paymentTransactionId: number;
  orderId: number;
  merchantOid: string;
  iframeToken: string;
  iframeUrl: string;
  amount: number;
  currencyCode: string;
  testMode: boolean;
}

export interface CustomerPriceListDto {
  id: number;
  code: string;
  name: string;
  customerId?: number;
  customerGroupCode?: string;
  currencyCode: string;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  items?: CustomerPriceListItemDto[];
}

export interface CustomerPriceListItemDto {
  id: number;
  priceListId: number;
  customerId?: number;
  catalogProductId?: number;
  catalogVariantId?: number;
  erpStockId?: number;
  unitPrice: number;
  minQuantity?: number;
  discountRate?: number;
  currencyCode: string;
  validFrom?: string;
  validTo?: string;
}

export interface InventorySnapshotDto {
  id: number;
  erpStockCode?: string;
  warehouseCode?: number;
  warehouseName?: string;
  availableQuantity: number;
  reservedQuantity: number;
  unit?: string;
  snapshotDate: string;
}

export interface QuoteRequestDto {
  id: number;
  quoteNumber: string;
  customerId: number;
  buyerId?: number;
  userId?: number;
  status: string;
  currencyCode: string;
  offerType?: string;
  offerDate?: string;
  offerNo?: string;
  revisionNo?: string;
  revisionId?: number;
  validUntil?: string;
  deliveryDate?: string;
  deliveryMethod?: string;
  paymentTypeId?: number;
  erpProjectCode?: string;
  generalDiscountRate?: number;
  generalDiscountAmount?: number;
  total?: number;
  estimatedTotal: number;
  customerNote?: string;
  salesNote?: string;
  submittedDate?: string;
  approvedDate?: string;
  lines?: QuoteRequestLineDto[];
}

export interface QuoteRequestLineDto {
  id: number;
  quoteRequestId: number;
  catalogProductId?: number;
  catalogVariantId?: number;
  erpStockId?: number;
  requestedSku?: string;
  requestedName?: string;
  quantity: number;
  targetUnitPrice?: number;
  approvedUnitPrice?: number;
  discountRate1?: number;
  discountAmount1?: number;
  discountRate2?: number;
  discountAmount2?: number;
  discountRate3?: number;
  discountAmount3?: number;
  vatRate?: number;
  vatAmount?: number;
  lineTotal?: number;
  lineGrandTotal?: number;
  priceSource?: string;
  priceListId?: number;
  exchangeRate?: number;
  priceResolvedAt?: string;
  description?: string;
  description1?: string;
  description2?: string;
  description3?: string;
  pricingRuleHeaderId?: number;
  relatedProductKey?: string;
  isMainRelatedProduct?: boolean;
  erpProjectCode?: string;
}

export interface ConvertQuoteToCartDto {
  quoteId?: number;
  buyerId?: number;
  userId?: number;
  allowBackorder?: boolean;
}

export interface B2bIntegrationEventDto {
  id: number;
  direction: string;
  eventType: string;
  entityName: string;
  entityId?: number;
  status: string;
  externalReference?: string;
  processedDate?: string;
}

export interface B2bCompanyDto {
  id: number;
  companyCode: string;
  companyName: string;
  customerId?: number;
  parentCompanyId?: number;
  customerGroupCode?: string;
  creditLimit?: number;
  currencyCode: string;
  status: string;
}

export interface B2bPortalSessionDto {
  token: string;
  expiresAt: string;
  company: B2bCompanyDto;
  buyer?: B2bBuyerDto;
  scope?: string;
  canViewCompanyHistory?: boolean;
}

export interface B2bBuyerDto {
  id: number;
  companyId: number;
  userId?: number;
  email: string;
  fullName: string;
  roleCode: string;
  orderLimit?: number;
  requiresApproval: boolean;
  isActive: boolean;
}

export interface CatalogVisibilityRuleDto {
  id: number;
  companyId?: number;
  customerId?: number;
  customerGroupCode?: string;
  catalogProductId?: number;
  categoryPath?: string;
  ruleType: string;
  isActive: boolean;
}

export interface ShoppingListDto {
  id: number;
  companyId: number;
  buyerId?: number;
  name: string;
  isShared: boolean;
  listType: string;
}

export interface PurchaseApprovalRuleDto {
  id: number;
  companyId: number;
  ruleName: string;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  currencyCode: string;
  approverRoleCode: string;
  isActive: boolean;
}

export interface B2bInsightScoreDto {
  score: number;
  status: string;
  message: string;
}

export interface B2bInsightMetricDto {
  key: string;
  label: string;
  group: string;
  value: number;
  secondaryValue?: number;
  unit?: string;
  status: string;
  description?: string;
}

export interface B2bInsightActionDto {
  severity: string;
  title: string;
  description: string;
  targetRoute?: string;
}

export interface B2bInsightSummaryDto {
  generatedAt: string;
  readiness: B2bInsightScoreDto;
  metrics: B2bInsightMetricDto[];
  actions: B2bInsightActionDto[];
}

export interface ResolveB2bPriceAvailabilityDto {
  customerId: number;
  customerGroupCode?: string;
  customerSku?: string;
  catalogProductId?: number;
  catalogVariantId?: number;
  erpStockId?: number;
  warehouseCode?: number;
  quantity: number;
  currencyCode?: string;
  requestedDate?: string;
}

export interface B2bWarehouseAvailabilityDto {
  warehouseCode?: number;
  warehouseName?: string;
  availableQuantity: number;
  reservedQuantity: number;
  availableToSell: number;
  unit?: string;
  snapshotDate: string;
  lastErpSyncDate?: string;
}

export interface B2bPriceAvailabilityDto {
  customerId: number;
  customerGroupCode?: string;
  catalogProductId?: number;
  catalogVariantId?: number;
  erpStockId?: number;
  resolvedSku?: string;
  resolvedName?: string;
  requestedQuantity: number;
  currencyCode: string;
  isPriceResolved: boolean;
  unitPrice?: number;
  discountRate?: number;
  lineTotal?: number;
  priceListId?: number;
  priceListCode?: string;
  priceSource?: string;
  priceResolvedAt?: string;
  vatRate?: number;
  vatAmount?: number;
  exchangeRate?: number;
  isAvailable: boolean;
  availableToSell: number;
  reservedQuantity: number;
  preferredWarehouseCode?: number;
  inventorySnapshotDate?: string;
  warehouses: B2bWarehouseAvailabilityDto[];
  warnings: string[];
}
