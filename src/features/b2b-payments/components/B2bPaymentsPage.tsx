import type { ReactElement } from 'react';
import { B2bWorkspacePage } from '@/features/b2b';

export function B2bPaymentsPage(): ReactElement {
  return <B2bWorkspacePage kind="payments" />;
}

export function B2bPaymentOperationsPage(): ReactElement {
  return <B2bWorkspacePage kind="payment-operations" />;
}
