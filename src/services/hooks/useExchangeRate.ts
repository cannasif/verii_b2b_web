import { useQuery } from '@tanstack/react-query';
import { lookupApi } from '@/services/lookup-api';

export function useExchangeRate(tarih?: Date, fiyatTipi = 1) {
  return useQuery({
    queryKey: ['exchangeRate', tarih?.toISOString().split('T')[0] || 'today', fiyatTipi],
    queryFn: () => lookupApi.getExchangeRate(tarih, fiyatTipi),
    staleTime: 5 * 60 * 1000,
  });
}
