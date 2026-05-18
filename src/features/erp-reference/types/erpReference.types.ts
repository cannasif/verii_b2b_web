import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';

export type ErpReferenceKind = 'customer' | 'stock' | 'warehouse' | 'yapkod';

export interface CustomerReferenceDto {
  id: number;
  branchCode?: string;
  customerCode: string;
  customerName: string;
  city?: string;
  phone1?: string;
  lastSyncDate?: string;
}

export interface StockReferenceDto {
  id: number;
  branchCode?: string;
  erpStockCode: string;
  stockName: string;
  unit?: string;
  grupKodu?: string;
  grupAdi?: string;
  ureticiKodu?: string;
  kod1?: string;
  kod1Adi?: string;
  kod2?: string;
  kod2Adi?: string;
  kod3?: string;
  kod3Adi?: string;
  kod4?: string;
  kod4Adi?: string;
  kod5?: string;
  kod5Adi?: string;
  lastSyncDate?: string;
}

export interface StockDetailDto {
  id: number;
  stockId: number;
  erpStockCode: string;
  stockName: string;
  htmlDescription: string;
  technicalSpecsJson?: string;
}

export interface CreateStockDetailDto {
  stockId: number;
  htmlDescription: string;
  technicalSpecsJson?: string;
}

export interface UpdateStockDetailDto {
  stockId: number;
  htmlDescription: string;
  technicalSpecsJson?: string;
}

export interface StockImageDto {
  id: number;
  stockId: number;
  erpStockCode: string;
  stockName: string;
  filePath: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface WarehouseReferenceDto {
  id: number;
  branchCode?: string;
  warehouseCode: number;
  warehouseName: string;
}

export interface YapKodReferenceDto {
  id: number;
  branchCode?: string;
  yapKod: string;
  yapAcik: string;
  yplndrStokKod?: string;
  lastSyncDate?: string;
}

export type ErpReferenceRow =
  | CustomerReferenceDto
  | StockReferenceDto
  | WarehouseReferenceDto
  | YapKodReferenceDto;

export type ErpReferencePagedResponse<T extends ErpReferenceRow> = Promise<PagedResponse<T>>;
export type ErpReferenceApiResponse<T> = Promise<ApiResponse<T>>;
export type ErpReferencePagedParams = PagedParams;
