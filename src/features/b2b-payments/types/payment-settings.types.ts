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

export type UpsertPaymentSettingDto = Omit<
  PaymentSettingDto,
  'id' | 'lastConnectionTestDate' | 'lastConnectionSuccessful' | 'lastConnectionMessage'
>;
