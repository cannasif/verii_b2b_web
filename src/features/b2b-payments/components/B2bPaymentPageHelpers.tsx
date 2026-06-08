import { type ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import type { PaymentOrderDto } from '../types/payment.types';

export type PaymentLinkDraft = {
  paymentOrder: PaymentOrderDto;
  providerKey: string;
  customerEmail: string;
  shareChannel: string;
  expiresAt: string;
  regenerateToken: boolean;
};

export type PartialCollectionDraft = {
  paymentOrder: PaymentOrderDto;
  amount: string;
  providerKey: string;
  paymentMethod: string;
  paymentInstallmentId: string;
  paymentOrderAllocationId: string;
  collectionDate: string;
  externalReference: string;
  queueErpPosting: boolean;
  notes: string;
};

export function formatMoney(amount?: number, currencyCode = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currencyCode }).format(amount ?? 0);
}

export function formatDate(value?: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

export function statusBadge(status?: string): ReactElement {
  const normalized = (status ?? '').toLowerCase();
  const isGood = ['paid', 'completed', 'success', 'approved'].some((item) => normalized.includes(item));
  const isBad = ['failed', 'cancelled', 'rejected', 'error'].some((item) => normalized.includes(item));
  return <Badge variant={isBad ? 'destructive' : isGood ? 'default' : 'secondary'}>{status || '-'}</Badge>;
}

export function canGeneratePaymentLink(paymentOrder: PaymentOrderDto): boolean {
  const status = paymentOrder.status?.toLowerCase() ?? '';
  return !paymentOrder.paymentLinkUrl && !['paid', 'cancelled', 'canceled'].includes(status) && (paymentOrder.remainingAmount ?? paymentOrder.amount) > 0;
}

export function defaultPaymentLinkDraft(paymentOrder: PaymentOrderDto): PaymentLinkDraft {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return {
    paymentOrder,
    providerKey: paymentOrder.paymentLinkProvider || paymentOrder.providerKey || 'PORTAL',
    customerEmail: paymentOrder.paymentLinkCustomerEmail || '',
    shareChannel: paymentOrder.paymentLinkShareChannel || 'COPY',
    expiresAt: expiresAt.toISOString().slice(0, 16),
    regenerateToken: false,
  };
}

export function defaultPartialCollectionDraft(paymentOrder: PaymentOrderDto): PartialCollectionDraft {
  return {
    paymentOrder,
    amount: String(paymentOrder.remainingAmount || paymentOrder.amount),
    providerKey: paymentOrder.providerKey || 'MANUAL',
    paymentMethod: 'PARTIAL_COLLECTION',
    paymentInstallmentId: '',
    paymentOrderAllocationId: '',
    collectionDate: new Date().toISOString().slice(0, 16),
    externalReference: '',
    queueErpPosting: true,
    notes: '',
  };
}
