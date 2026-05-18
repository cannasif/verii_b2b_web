import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  CreateStockDetailDto,
  CustomerReferenceDto,
  ErpReferenceKind,
  StockReferenceDto,
  StockDetailDto,
  StockImageDto,
  UpdateStockDetailDto,
  WarehouseReferenceDto,
  YapKodReferenceDto,
} from '../types/erpReference.types';

function normalizeCustomer(row: Record<string, unknown>): CustomerReferenceDto {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    branchCode: row.branchCode ? String(row.branchCode) : row.BranchCode ? String(row.BranchCode) : undefined,
    customerCode: String(row.customerCode ?? row.CustomerCode ?? ''),
    customerName: String(row.customerName ?? row.CustomerName ?? ''),
    city: row.city ? String(row.city) : row.City ? String(row.City) : undefined,
    phone1: row.phone1 ? String(row.phone1) : row.Phone1 ? String(row.Phone1) : undefined,
    lastSyncDate: row.lastSyncDate ? String(row.lastSyncDate) : row.LastSyncDate ? String(row.LastSyncDate) : undefined,
  };
}

function normalizeStock(row: Record<string, unknown>): StockReferenceDto {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    branchCode: row.branchCode ? String(row.branchCode) : row.BranchCode ? String(row.BranchCode) : undefined,
    erpStockCode: String(row.erpStockCode ?? row.ErpStockCode ?? ''),
    stockName: String(row.stockName ?? row.StockName ?? ''),
    unit: row.unit ? String(row.unit) : row.Unit ? String(row.Unit) : undefined,
    grupKodu: row.grupKodu ? String(row.grupKodu) : row.GrupKodu ? String(row.GrupKodu) : undefined,
    grupAdi: row.grupAdi ? String(row.grupAdi) : row.GrupAdi ? String(row.GrupAdi) : undefined,
    ureticiKodu: row.ureticiKodu ? String(row.ureticiKodu) : row.UreticiKodu ? String(row.UreticiKodu) : undefined,
    kod1: row.kod1 ? String(row.kod1) : row.Kod1 ? String(row.Kod1) : undefined,
    kod1Adi: row.kod1Adi ? String(row.kod1Adi) : row.Kod1Adi ? String(row.Kod1Adi) : undefined,
    kod2: row.kod2 ? String(row.kod2) : row.Kod2 ? String(row.Kod2) : undefined,
    kod2Adi: row.kod2Adi ? String(row.kod2Adi) : row.Kod2Adi ? String(row.Kod2Adi) : undefined,
    kod3: row.kod3 ? String(row.kod3) : row.Kod3 ? String(row.Kod3) : undefined,
    kod3Adi: row.kod3Adi ? String(row.kod3Adi) : row.Kod3Adi ? String(row.Kod3Adi) : undefined,
    kod4: row.kod4 ? String(row.kod4) : row.Kod4 ? String(row.Kod4) : undefined,
    kod4Adi: row.kod4Adi ? String(row.kod4Adi) : row.Kod4Adi ? String(row.Kod4Adi) : undefined,
    kod5: row.kod5 ? String(row.kod5) : row.Kod5 ? String(row.Kod5) : undefined,
    kod5Adi: row.kod5Adi ? String(row.kod5Adi) : row.Kod5Adi ? String(row.Kod5Adi) : undefined,
    lastSyncDate: row.lastSyncDate ? String(row.lastSyncDate) : row.LastSyncDate ? String(row.LastSyncDate) : undefined,
  };
}

function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || response.exceptionMessage || 'Request failed');
  }

  return response.data;
}

function normalizeStockDetail(row: Record<string, unknown> | null | undefined): StockDetailDto | null {
  if (!row) return null;

  return {
    id: Number(row.id ?? row.Id ?? 0),
    stockId: Number(row.stockId ?? row.StockId ?? 0),
    erpStockCode: String(row.erpStockCode ?? row.ErpStockCode ?? ''),
    stockName: String(row.stockName ?? row.StockName ?? ''),
    htmlDescription: String(row.htmlDescription ?? row.HtmlDescription ?? ''),
    technicalSpecsJson: row.technicalSpecsJson ? String(row.technicalSpecsJson) : row.TechnicalSpecsJson ? String(row.TechnicalSpecsJson) : undefined,
  };
}

function normalizeStockImage(row: Record<string, unknown>): StockImageDto {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    stockId: Number(row.stockId ?? row.StockId ?? 0),
    erpStockCode: String(row.erpStockCode ?? row.ErpStockCode ?? ''),
    stockName: String(row.stockName ?? row.StockName ?? ''),
    filePath: String(row.filePath ?? row.FilePath ?? ''),
    altText: row.altText ? String(row.altText) : row.AltText ? String(row.AltText) : undefined,
    sortOrder: Number(row.sortOrder ?? row.SortOrder ?? 0),
    isPrimary: Boolean(row.isPrimary ?? row.IsPrimary ?? false),
  };
}

function normalizeWarehouse(row: Record<string, unknown>): WarehouseReferenceDto {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    branchCode: row.branchCode ? String(row.branchCode) : row.BranchCode ? String(row.BranchCode) : undefined,
    warehouseCode: Number(row.warehouseCode ?? row.WarehouseCode ?? 0),
    warehouseName: String(row.warehouseName ?? row.WarehouseName ?? ''),
  };
}

function normalizeYapKod(row: Record<string, unknown>): YapKodReferenceDto {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    branchCode: row.branchCode ? String(row.branchCode) : row.BranchCode ? String(row.BranchCode) : undefined,
    yapKod: String(row.yapKod ?? row.YapKod ?? ''),
    yapAcik: String(row.yapAcik ?? row.YapAcik ?? ''),
    yplndrStokKod: row.yplndrStokKod ? String(row.yplndrStokKod) : row.YplndrStokKod ? String(row.YplndrStokKod) : undefined,
    lastSyncDate: row.lastSyncDate ? String(row.lastSyncDate) : row.LastSyncDate ? String(row.LastSyncDate) : undefined,
  };
}

function getEndpoint(kind: ErpReferenceKind): string {
  switch (kind) {
    case 'customer': return '/api/Customer/paged';
    case 'stock': return '/api/Stock/paged';
    case 'warehouse': return '/api/Warehouse/paged';
    case 'yapkod': return '/api/YapKod/paged';
  }
}

function normalizePaged<T>(
  response: ApiResponse<PagedResponse<Record<string, unknown>>>,
  mapRow: (row: Record<string, unknown>) => T,
): PagedResponse<T> {
  const data = response.data;
  return {
    ...(data ?? {
      data: [],
      totalCount: 0,
      pageNumber: 0,
      pageSize: 20,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    }),
    data: (data?.data ?? []).map((row) => mapRow(row)),
  };
}

export const erpReferenceApi = {
  async getCustomers(params: PagedParams = {}): Promise<PagedResponse<CustomerReferenceDto>> {
    const response = await api.post<ApiResponse<PagedResponse<Record<string, unknown>>>>(
      getEndpoint('customer'),
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'CustomerCode', sortDirection: 'asc' }),
    );
    return normalizePaged(response, normalizeCustomer);
  },

  async getStocks(params: PagedParams = {}): Promise<PagedResponse<StockReferenceDto>> {
    const response = await api.post<ApiResponse<PagedResponse<Record<string, unknown>>>>(
      getEndpoint('stock'),
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'ErpStockCode', sortDirection: 'asc' }),
    );
    return normalizePaged(response, normalizeStock);
  },

  async getStockById(id: number): Promise<StockReferenceDto> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>(`/api/Stock/${id}`);
    return normalizeStock(extractData(response));
  },

  async getStockDetail(stockId: number): Promise<StockDetailDto | null> {
    const response = await api.get<ApiResponse<Record<string, unknown> | null>>(`/api/StockDetail/stock/${stockId}`);
    return normalizeStockDetail(extractData(response));
  },

  async createStockDetail(dto: CreateStockDetailDto): Promise<StockDetailDto> {
    const response = await api.post<ApiResponse<Record<string, unknown>>>('/api/StockDetail', dto);
    const data = normalizeStockDetail(extractData(response));
    if (!data) throw new Error('Stock detail not returned');
    return data;
  },

  async updateStockDetail(id: number, dto: UpdateStockDetailDto): Promise<StockDetailDto> {
    const response = await api.put<ApiResponse<Record<string, unknown>>>(`/api/StockDetail/${id}`, dto);
    const data = normalizeStockDetail(extractData(response));
    if (!data) throw new Error('Stock detail not returned');
    return data;
  },

  async getStockImages(stockId: number): Promise<StockImageDto[]> {
    const response = await api.get<ApiResponse<Array<Record<string, unknown>>>>(`/api/StockImage/by-stock/${stockId}`);
    return extractData(response).map(normalizeStockImage);
  },

  async uploadStockImages(stockId: number, files: File[], altTexts?: string[]): Promise<StockImageDto[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    altTexts?.forEach((altText) => formData.append('altTexts', altText));

    const response = await api.post<ApiResponse<Array<Record<string, unknown>>>>(
      `/api/StockImage/upload/${stockId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return extractData(response).map(normalizeStockImage);
  },

  async deleteStockImage(id: number): Promise<void> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/StockImage/${id}`);
    extractData(response);
  },

  async setPrimaryStockImage(id: number): Promise<StockImageDto> {
    const response = await api.put<ApiResponse<Record<string, unknown>>>(`/api/StockImage/set-primary/${id}`);
    return normalizeStockImage(extractData(response));
  },

  async getWarehouses(params: PagedParams = {}): Promise<PagedResponse<WarehouseReferenceDto>> {
    const response = await api.post<ApiResponse<PagedResponse<Record<string, unknown>>>>(
      getEndpoint('warehouse'),
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'WarehouseCode', sortDirection: 'asc' }),
    );
    return normalizePaged(response, normalizeWarehouse);
  },

  async getYapKodlar(params: PagedParams = {}): Promise<PagedResponse<YapKodReferenceDto>> {
    const response = await api.post<ApiResponse<PagedResponse<Record<string, unknown>>>>(
      getEndpoint('yapkod'),
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'YapKod', sortDirection: 'asc' }),
    );
    return normalizePaged(response, normalizeYapKod);
  },
};
