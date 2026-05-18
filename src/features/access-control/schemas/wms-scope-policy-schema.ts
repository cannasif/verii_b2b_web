import { z } from 'zod';

export const WMS_SCOPE_POLICY_SCOPE_TYPES = ['unrestricted', 'branch', 'warehouse', 'assigned-only'] as const;

export const WMS_SCOPE_POLICY_ENTITY_TYPES = [
  'GoodsReceipt',
  'WarehouseInbound',
  'WarehouseOutbound',
  'Transfer',
  'Shipment',
  'Package',
  'InventoryCount',
  'Production',
  'ProductionTransfer',
] as const;

export const createWmsScopePolicySchema = z.object({
  code: z.string().min(1).max(120),
  name: z.string().min(1).max(150),
  entityType: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  scopeType: z.string().min(1).max(50),
  includeSelf: z.boolean(),
  isActive: z.boolean(),
});

export const updateWmsScopePolicySchema = createWmsScopePolicySchema.partial();

export type CreateWmsScopePolicySchema = z.infer<typeof createWmsScopePolicySchema>;
export type UpdateWmsScopePolicySchema = z.infer<typeof updateWmsScopePolicySchema>;
