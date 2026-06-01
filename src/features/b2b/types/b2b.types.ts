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
  | 'payment-operations'
  | 'marketplace-channels'
  | 'marketplace-listings'
  | 'marketplace-events'
  | 'integrations';

export interface MarketplaceCapabilityDto {
  providerKey: string;
  name: string;
  supportsProductCreate: boolean;
  supportsPriceUpdate: boolean;
  supportsStockUpdate: boolean;
  supportsOrderImport: boolean;
  documentationUrl: string;
  notes: string;
}

export interface MarketplaceChannelDto {
  id: number;
  code: string;
  name: string;
  providerKey: string;
  sellerId?: string;
  apiBaseUrl?: string;
  authType: string;
  credentialsMasked?: string;
  supportsProductCreate: boolean;
  supportsPriceUpdate: boolean;
  supportsStockUpdate: boolean;
  supportsOrderImport: boolean;
  isActive: boolean;
  lastSyncDate?: string;
  lastConnectionTestDate?: string;
  lastConnectionSuccessful?: boolean;
  lastConnectionStatus?: string;
  lastConnectionMessage?: string;
  lastConnectionDetails?: string;
  lastConnectionHttpStatusCode?: number;
  lastConnectionEndpoint?: string;
  lastConnectionErrorCode?: string;
  notes?: string;
}

export interface MarketplaceCredentialFieldDto {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface MarketplaceProviderSettingDto {
  providerKey: string;
  name: string;
  defaultAuthType: string;
  supportedAuthTypes: string[];
  documentationUrl: string;
  setupSummary: string;
  supportsProductCreate: boolean;
  supportsPriceUpdate: boolean;
  supportsStockUpdate: boolean;
  supportsOrderImport: boolean;
  credentialFields: MarketplaceCredentialFieldDto[];
  channel?: MarketplaceChannelDto;
}

export interface MarketplaceConnectionTestRequestDto {
  providerKey: string;
  channelId?: number;
  sellerId?: string;
  apiBaseUrl?: string;
  authType?: string;
  credentialsJson?: string;
}

export interface MarketplaceConnectionTestResultDto {
  providerKey: string;
  status: string;
  isSuccessful: boolean;
  message?: string;
  details?: string;
  httpStatusCode?: number;
  endpoint?: string;
  errorCode?: string;
  testedAt?: string;
}

export interface MarketplaceListingDto {
  id: number;
  channelId: number;
  channelName?: string;
  providerKey?: string;
  catalogProductId?: number;
  catalogProductName?: string;
  erpStockId?: number;
  sku: string;
  barcode?: string;
  marketplaceProductId?: string;
  marketplaceListingId?: string;
  status: string;
  lastPushedPrice?: number;
  lastPushedQuantity?: number;
  currencyCode: string;
  lastProductSyncDate?: string;
  lastPriceSyncDate?: string;
  lastStockSyncDate?: string;
  errorMessage?: string;
}

export interface MarketplaceSyncEventDto {
  id: number;
  channelId: number;
  channelName?: string;
  providerKey?: string;
  listingId?: number;
  sku?: string;
  operationType: string;
  status: string;
  externalBatchId?: string;
  requestJson?: string;
  responseJson?: string;
  errorMessage?: string;
  retryCount: number;
  requestedDate: string;
  processedDate?: string;
}

export interface BulkMarketplaceOperationResultDto {
  erpStockId: number;
  price: number;
  currencyCode: string;
  queuedCount: number;
  skippedCount: number;
  events: MarketplaceSyncEventDto[];
  skippedReasons: string[];
}

export interface CatalogProductDto {
  id: number;
  sku: string;
  name: string;
  slug?: string;
  brand?: string;
  productType?: string;
  manufacturerCode?: string;
  barcode?: string;
  unit?: string;
  categoryPath?: string;
  shortDescription?: string;
  description?: string;
  primaryImageUrl?: string;
  bulletPointsJson?: string;
  attributesJson?: string;
  mediaGalleryJson?: string;
  documentsJson?: string;
  metaTitle?: string;
  metaDescription?: string;
  searchKeywords?: string;
  minOrderQuantity?: number;
  packageQuantity?: number;
  sortOrder?: number;
  completenessScore?: number;
  isPublished: boolean;
  defaultStockId?: number;
  variants?: CatalogVariantDto[];
}

export interface CatalogProductFavoriteDto {
  id: number;
  companyId: number;
  companyName?: string;
  buyerId?: number;
  buyerName?: string;
  userId?: number;
  catalogProductId?: number;
  catalogVariantId?: number;
  erpStockId?: number;
  favoriteKey: string;
  sku?: string;
  productName?: string;
  productImageUrl?: string;
  brand?: string;
  categoryPath?: string;
  variantName?: string;
  note?: string;
}

export interface CatalogFavoriteToggleResultDto {
  isFavorite: boolean;
  favoriteId?: number;
  favoriteKey: string;
}

export interface CatalogVariantDto {
  id: number;
  catalogProductId: number;
  erpStockId?: number;
  variantSku: string;
  variantName: string;
  barcode?: string;
  unit?: string;
  attributesJson?: string;
  mediaGalleryJson?: string;
  sortOrder?: number;
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
  paymentOrderId?: number;
  paymentInstallmentId?: number;
  providerKey: string;
  externalTransactionId?: string;
  status: string;
  amount: number;
  providerPaymentAmount?: number;
  providerCollectedAmount?: number;
  currencyCode: string;
  paymentMethod?: string;
  dueDate?: string;
  paymentTermDays?: number;
  installmentCount: number;
  installmentPlanJson?: string;
  providerConversationId?: string;
  binNumber?: string;
  cardType?: string;
  cardAssociation?: string;
  cardFamily?: string;
  bankName?: string;
  bankCode?: string;
  isCommercialCard?: boolean;
  providerRate?: number;
  providerCommissionAmount?: number;
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

export interface PaymentBinLookupRequestDto {
  providerKey: string;
  binNumber: string;
  amount?: number;
  currencyCode?: string;
  conversationId?: string;
}

export interface PaymentInstallmentOptionsRequestDto {
  providerKey: string;
  binNumber?: string;
  amount: number;
  currencyCode?: string;
  conversationId?: string;
}

export interface PaymentBinLookupDto {
  providerKey: string;
  binNumber: string;
  cardType?: string;
  cardAssociation?: string;
  cardFamily?: string;
  bankName?: string;
  bankCode?: string;
  isCommercial?: boolean;
  providerStatus?: string;
  conversationId?: string;
  rawResponseJson?: string;
}

export interface PaymentInstallmentOptionsDto {
  providerKey: string;
  binNumber?: string;
  amount: number;
  currencyCode: string;
  providerStatus?: string;
  conversationId?: string;
  card?: PaymentBinLookupDto;
  options: PaymentInstallmentOptionDto[];
  rawResponseJson?: string;
}

export interface PaymentInstallmentOptionDto {
  installmentNumber: number;
  installmentPrice: number;
  totalPrice: number;
  providerRate?: number;
  commissionAmount?: number;
  isAvailable: boolean;
}

export interface PaymentOrderDto {
  id: number;
  paymentOrderNumber: string;
  orderId?: number;
  customerId: number;
  buyerId?: number;
  userId?: number;
  status: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  currencyCode: string;
  paymentTermDays?: number;
  dueDate: string;
  isDueDateOverridden: boolean;
  installmentCount: number;
  paymentMethod?: string;
  providerKey?: string;
  providerConversationId?: string;
  binNumber?: string;
  cardType?: string;
  cardAssociation?: string;
  cardFamily?: string;
  bankName?: string;
  bankCode?: string;
  isCommercialCard?: boolean;
  providerInstallmentNumber?: number;
  providerInstallmentPrice?: number;
  providerTotalPrice?: number;
  providerRate?: number;
  providerCommissionAmount?: number;
  providerInstallmentSnapshotJson?: string;
  paymentLinkUrl?: string;
  paymentLinkToken?: string;
  paymentLinkProvider?: string;
  paymentLinkStatus?: string;
  paymentLinkExpiresAt?: string;
  paymentLinkSentAt?: string;
  paymentLinkCustomerEmail?: string;
  paymentLinkShareChannel?: string;
  notes?: string;
  installments: PaymentInstallmentDto[];
}

export interface GeneratePaymentOrderLinkDto {
  portalBaseUrl: string;
  providerKey?: string;
  customerEmail?: string;
  shareChannel?: string;
  expiresAt?: string;
  regenerateToken?: boolean;
}

export interface PaymentInstallmentDto {
  id: number;
  paymentOrderId: number;
  installmentNumber: number;
  status: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  paidDate?: string;
  notes?: string;
}

export interface SelectPaymentProviderInstallmentDto {
  providerKey: string;
  providerConversationId?: string;
  binNumber?: string;
  cardType?: string;
  cardAssociation?: string;
  cardFamily?: string;
  bankName?: string;
  bankCode?: string;
  isCommercialCard?: boolean;
  installmentNumber: number;
  installmentPrice: number;
  totalPrice: number;
  providerRate?: number;
  providerCommissionAmount?: number;
  providerInstallmentSnapshotJson?: string;
}

export interface CreatePaymentOrderDto {
  orderId?: number;
  customerId?: number;
  amount?: number;
  currencyCode?: string;
  paymentTermDays?: number;
  dueDate?: string;
  installmentCount: number;
  paymentMethod?: string;
  providerKey?: string;
  notes?: string;
}

export interface PaymentMethodOptionDto {
  providerKey: string;
  paymentMethod: string;
  displayName: string;
  requiresApproval: boolean;
  isProviderHosted: boolean;
  isDeferredPayment: boolean;
}

export interface PaymentSettingDto {
  id: number;
  providerKey: string;
  displayName: string;
  isActive: boolean;
  isTestMode: boolean;
  postingMode: string;
  cariPostingMode: string;
  installmentPostingMode: string;
  autoPostSuccessfulPaymentsToErp: boolean;
  requireManualApprovalBeforeErpPosting: boolean;
  closeCustomerBalanceOnSuccessfulPayment: boolean;
  createInstallmentReceivableLines: boolean;
  postCommissionToExpenseAccount: boolean;
  passInstallmentFeeToCustomer: boolean;
  maxInstallmentCount: number;
  allowedInstallmentsCsv: string;
  minInstallmentAmount?: number;
  defaultCurrencyCode: string;
  erpCashAccountCode?: string;
  erpBankAccountCode?: string;
  erpPosAccountCode?: string;
  erpCommissionExpenseAccountCode?: string;
  erpVadeFarkiIncomeAccountCode?: string;
  merchantIdMasked?: string;
  apiBaseUrl?: string;
  callbackUrl?: string;
  webhookSecretMasked?: string;
  lastConnectionTestDate?: string;
  lastConnectionSuccessful?: boolean;
  lastConnectionMessage?: string;
  notes?: string;
}

export type UpsertPaymentSettingDto = Omit<PaymentSettingDto, 'id' | 'lastConnectionTestDate' | 'lastConnectionSuccessful' | 'lastConnectionMessage'>;

export interface Iyzico3dsInitializeDto {
  paymentTransactionId: number;
  orderId: number;
  conversationId: string;
  paymentId?: string;
  status: string;
  threeDSHtmlContent?: string;
  paymentPageUrl?: string;
  amount: number;
  currencyCode: string;
}

export interface CreateIyzico3dsPaymentDto {
  orderId: number;
  email: string;
  buyerName: string;
  buyerSurname: string;
  buyerPhone: string;
  buyerAddress: string;
  city: string;
  country: string;
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
  installmentCount: number;
  callbackUrl?: string;
  buyerIp?: string;
}

export interface PaymentProviderOperationDto {
  id: number;
  paymentTransactionId: number;
  paymentOrderId?: number;
  paymentInstallmentId?: number;
  providerKey: string;
  operationType: string;
  status: string;
  amount: number;
  currencyCode: string;
  externalOperationId?: string;
  idempotencyKey?: string;
  reason?: string;
  errorMessage?: string;
  requestedDate: string;
  processedDate?: string;
}

export interface CreatePaymentProviderOperationDto {
  paymentTransactionId: number;
  paymentInstallmentId?: number;
  operationType: string;
  amount: number;
  currencyCode: string;
  idempotencyKey?: string;
  reason?: string;
}

export interface ResolvePaymentMethodsDto {
  customerId: number;
  companyId?: number;
  customerGroupCode?: string;
  amount: number;
  currencyCode: string;
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
