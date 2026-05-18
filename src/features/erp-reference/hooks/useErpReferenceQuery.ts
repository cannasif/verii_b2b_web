import { useQuery } from '@tanstack/react-query';
import type { PagedParams } from '@/types/api';
import { erpReferenceApi } from '../api/erpReference.api';
import type { ErpReferenceKind } from '../types/erpReference.types';
import type { PagedResponse } from '@/types/api';
import type { CustomerReferenceDto, StockReferenceDto, WarehouseReferenceDto, YapKodReferenceDto } from '../types/erpReference.types';

export function useErpReferenceQuery(kind: ErpReferenceKind, params: PagedParams = {}) {
  return useQuery<PagedResponse<CustomerReferenceDto | StockReferenceDto | WarehouseReferenceDto | YapKodReferenceDto>>({
    queryKey: ['erp-reference', kind, params],
    queryFn: () => {
      switch (kind) {
        case 'customer': return erpReferenceApi.getCustomers(params) as Promise<PagedResponse<CustomerReferenceDto | StockReferenceDto | WarehouseReferenceDto | YapKodReferenceDto>>;
        case 'stock': return erpReferenceApi.getStocks(params) as Promise<PagedResponse<CustomerReferenceDto | StockReferenceDto | WarehouseReferenceDto | YapKodReferenceDto>>;
        case 'warehouse': return erpReferenceApi.getWarehouses(params) as Promise<PagedResponse<CustomerReferenceDto | StockReferenceDto | WarehouseReferenceDto | YapKodReferenceDto>>;
        case 'yapkod': return erpReferenceApi.getYapKodlar(params) as Promise<PagedResponse<CustomerReferenceDto | StockReferenceDto | WarehouseReferenceDto | YapKodReferenceDto>>;
      }
    },
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}
