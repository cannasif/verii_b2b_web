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
  paymentOrderId?: number;
  paymentLinkToken?: string;
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
  paymentOrderId: number;
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

export interface PaymentProviderReadinessDto {
  providerKey: string;
  displayName: string;
  isConfigured: boolean;
  hasCredentials: boolean;
  hasCallbackUrl: boolean;
  hasRequiredEndpoints: boolean;
  supportsBinLookup: boolean;
  supportsInstallments: boolean;
  supportsHostedPayment: boolean;
  supports3ds: boolean;
  supportsRefund: boolean;
  supportsCancel: boolean;
  maxInstallmentCount: number;
  environment: string;
  documentationUrl: string;
  missingItems: string[];
  nextActions: string[];
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
  allocations: PaymentOrderAllocationDto[];
}

export interface PaymentOrderAllocationDto {
  id: number;
  paymentOrderId: number;
  paymentTransactionId?: number;
  customerId: number;
  allocationType: string;
  status: string;
  erpDocumentType?: string;
  erpDocumentNumber?: string;
  erpDocumentReference?: string;
  documentDate?: string;
  dueDate?: string;
  documentAmount: number;
  openAmount: number;
  allocatedAmount: number;
  paidAmount: number;
  currencyCode: string;
  erpCurrencyCode?: number;
  currencyName?: string;
  exchangeRate?: number;
  exchangeRateSource?: string;
  exchangeRateDate?: string;
  externalReference?: string;
  notes?: string;
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
  allocations?: CreatePaymentOrderAllocationDto[];
}

export interface CreatePaymentOrderAllocationDto {
  allocationType: string;
  erpDocumentType?: string;
  erpDocumentNumber?: string;
  erpDocumentReference?: string;
  documentDate?: string;
  dueDate?: string;
  documentAmount: number;
  openAmount: number;
  allocatedAmount: number;
  currencyCode?: string;
  externalReference?: string;
  notes?: string;
}

export interface PaymentMethodOptionDto {
  providerKey: string;
  paymentMethod: string;
  displayName: string;
  requiresApproval: boolean;
  isProviderHosted: boolean;
  isDeferredPayment: boolean;
  isAvailable: boolean;
  unavailableReason?: string;
  riskLevel: string;
  creditLimit?: number;
  currentExposure: number;
  availableCredit?: number;
  paymentTermDays?: number;
  warnings: string[];
}

export interface PaymentFinanceDashboardDto {
  pendingPaymentOrderCount: number;
  pendingPaymentAmount: number;
  overduePaymentOrderCount: number;
  overduePaymentAmount: number;
  failedCallbackCount: number;
  pendingErpPostingCount: number;
  failedErpPostingCount: number;
  pendingRefundCount: number;
  currencyCode: string;
  generatedAt: string;
  currencyBreakdowns: PaymentFinanceDashboardBreakdownDto[];
  providerBreakdowns: PaymentFinanceDashboardBreakdownDto[];
}

export interface PaymentFinanceDashboardBreakdownDto {
  key: string;
  displayName: string;
  currencyCode: string;
  pendingPaymentOrderCount: number;
  pendingPaymentAmount: number;
  overduePaymentOrderCount: number;
  overduePaymentAmount: number;
}

export interface Iyzico3dsInitializeDto {
  paymentTransactionId: number;
  orderId: number;
  paymentOrderId: number;
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
  paymentOrderId?: number;
  paymentLinkToken?: string;
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

export interface PaymentErpPostingDto {
  id: number;
  paymentOrderId: number;
  paymentTransactionId?: number;
  paymentInstallmentId?: number;
  customerId: number;
  providerKey: string;
  postingMode: string;
  status: string;
  amount: number;
  currencyCode: string;
  erpCustomerCode?: string;
  externalReference?: string;
  idempotencyKey?: string;
  errorMessage?: string;
  attemptCount: number;
  requestedDate: string;
  lastAttemptDate?: string;
  postedDate?: string;
  nextRetryDate?: string;
  notes?: string;
}

export interface QueuePaymentErpPostingDto {
  paymentOrderId: number;
  paymentTransactionId?: number;
  paymentInstallmentId?: number;
  amount: number;
  currencyCode: string;
  postingMode?: string;
  idempotencyKey?: string;
  notes?: string;
}

export interface CreatePartialPaymentAllocationDto {
  paymentTransactionId?: number;
  paymentInstallmentId?: number;
  paymentOrderAllocationId?: number;
  amount: number;
  currencyCode: string;
  providerKey: string;
  paymentMethod: string;
  collectionDate?: string;
  queueErpPosting: boolean;
  externalReference?: string;
  notes?: string;
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
