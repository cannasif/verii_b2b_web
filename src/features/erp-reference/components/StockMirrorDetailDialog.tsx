import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, FileJson, Image as ImageIcon, PackageSearch, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { erpReferenceApi } from '../api/erpReference.api';
import type { CreateStockDetailDto, UpdateStockDetailDto } from '../types/erpReference.types';
import { StockMirrorImageList } from './StockMirrorImageList';
import { StockMirrorImageUpload } from './StockMirrorImageUpload';

interface StockMirrorDetailDialogProps {
  stockId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function queryKeys(stockId: number) {
  return {
    stock: ['erp-stock', stockId] as const,
    detail: ['erp-stock-detail', stockId] as const,
    images: ['erp-stock-images', stockId] as const,
  };
}

export function StockMirrorDetailDialog({ stockId, open, onOpenChange }: StockMirrorDetailDialogProps): ReactElement {
  const queryClient = useQueryClient();

  const stockQuery = useQuery({
    queryKey: stockId ? queryKeys(stockId).stock : ['erp-stock', 'empty'],
    queryFn: () => erpReferenceApi.getStockById(stockId!),
    enabled: open && stockId !== null,
    retry: false,
  });

  const detailQuery = useQuery({
    queryKey: stockId ? queryKeys(stockId).detail : ['erp-stock-detail', 'empty'],
    queryFn: () => erpReferenceApi.getStockDetail(stockId!),
    enabled: open && stockId !== null,
    retry: false,
  });

  const imagesQuery = useQuery({
    queryKey: stockId ? queryKeys(stockId).images : ['erp-stock-images', 'empty'],
    queryFn: () => erpReferenceApi.getStockImages(stockId!),
    enabled: open && stockId !== null,
    retry: false,
  });

  const [htmlDescription, setHtmlDescription] = useState('');
  const [technicalSpecsJson, setTechnicalSpecsJson] = useState('');

  useEffect(() => {
    setHtmlDescription(detailQuery.data?.htmlDescription ?? '');
    setTechnicalSpecsJson(detailQuery.data?.technicalSpecsJson ?? '');
  }, [detailQuery.data?.htmlDescription, detailQuery.data?.technicalSpecsJson, detailQuery.data?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!stockId) throw new Error('Stock id is required');

      if (detailQuery.data?.id) {
        const dto: UpdateStockDetailDto = {
          stockId,
          htmlDescription,
          technicalSpecsJson: technicalSpecsJson.trim() || undefined,
        };
        return erpReferenceApi.updateStockDetail(detailQuery.data.id, dto);
      }

      const dto: CreateStockDetailDto = {
        stockId,
        htmlDescription,
        technicalSpecsJson: technicalSpecsJson.trim() || undefined,
      };
      return erpReferenceApi.createStockDetail(dto);
    },
    onSuccess: async () => {
      if (!stockId) return;
      await queryClient.invalidateQueries({ queryKey: queryKeys(stockId).detail });
    },
  });

  const stock = stockQuery.data;
  const images = imagesQuery.data ?? [];
  const isBusy = stockQuery.isLoading || detailQuery.isLoading || imagesQuery.isLoading;

  const classificationRows = useMemo(() => {
    if (!stock) return [];
    return [
      ['Grup', stock.grupAdi || stock.grupKodu || '-'],
      ['Üretici Kodu', stock.ureticiKodu || '-'],
      ['Kod1', [stock.kod1, stock.kod1Adi].filter(Boolean).join(' - ') || '-'],
      ['Kod2', [stock.kod2, stock.kod2Adi].filter(Boolean).join(' - ') || '-'],
      ['Kod3', [stock.kod3, stock.kod3Adi].filter(Boolean).join(' - ') || '-'],
      ['Kod4', [stock.kod4, stock.kod4Adi].filter(Boolean).join(' - ') || '-'],
      ['Kod5', [stock.kod5, stock.kod5Adi].filter(Boolean).join(' - ') || '-'],
    ];
  }, [stock]);

  async function refreshImages(): Promise<void> {
    if (!stockId) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys(stockId).images });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Stok Mirror Detayı</DialogTitle>
          <DialogDescription>CRM’deki stok penceresinin WMS için sadeleştirilmiş uyarlaması. Görsel yönetimi ve detay notları burada tutulur.</DialogDescription>
        </DialogHeader>

        {isBusy ? (
          <div className="py-8 text-sm text-slate-500">Yükleniyor...</div>
        ) : !stock ? (
          <div className="py-8 text-sm text-red-600">Stok kaydı yüklenemedi.</div>
        ) : (
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList>
              <TabsTrigger value="basic">
                <PackageSearch className="mr-2 h-4 w-4" />
                Temel Bilgi
              </TabsTrigger>
              <TabsTrigger value="images">
                <ImageIcon className="mr-2 h-4 w-4" />
                Görseller
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-12">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Box className="h-4 w-4" />
                      Stok Özeti
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <span className="text-slate-500">Kod</span>
                      <span className="font-mono">{stock.erpStockCode}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <span className="text-slate-500">Ad</span>
                      <span className="font-medium">{stock.stockName}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <span className="text-slate-500">Birim</span>
                      <span>{stock.unit || '-'}</span>
                    </div>
                    {classificationRows.map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[110px_1fr] gap-2">
                        <span className="text-slate-500">{label}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileJson className="h-4 w-4" />
                      Detay ve Teknik Bilgi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock-html-description">Açıklama</Label>
                      <Textarea
                        id="stock-html-description"
                        value={htmlDescription}
                        onChange={(event) => setHtmlDescription(event.target.value)}
                        rows={8}
                        placeholder="Stok için açıklama veya içerik notu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock-technical-specs">Teknik Özellikler (JSON / metin)</Label>
                      <Textarea
                        id="stock-technical-specs"
                        value={technicalSpecsJson}
                        onChange={(event) => setTechnicalSpecsJson(event.target.value)}
                        rows={8}
                        placeholder='{"color":"black","size":"xl"}'
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" onClick={() => void saveMutation.mutateAsync()} disabled={saveMutation.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {detailQuery.data ? 'Güncelle' : 'Kaydet'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-6">
              <StockMirrorImageUpload stockId={stock.id} onUploaded={refreshImages} />
              <StockMirrorImageList images={images} isBusy={imagesQuery.isFetching} onChanged={refreshImages} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
