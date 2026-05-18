import { useMemo } from 'react';
import { useExchangeRate } from './useExchangeRate';

export interface CurrencyOption {
  value: string;
  label: string;
  code: string;
  dovizTipi: number;
  kurDegeri: number | null;
  dovizIsmi: string | null;
}

const defaultCurrencyOptions: CurrencyOption[] = [
  { value: 'TRY', label: 'TRY - Türk Lirası', code: 'TRY', dovizTipi: 0, kurDegeri: 1, dovizIsmi: 'Türk Lirası' },
];

function normalizeCurrencyCode(dovizTipi: number, dovizIsmi: string | null): string {
  const normalizedName = (dovizIsmi || '').trim().toUpperCase();
  if (dovizTipi === 0 || normalizedName === 'TL' || normalizedName === 'TRY' || normalizedName.includes('TÜRK')) return 'TRY';
  if (normalizedName === 'EURO' || normalizedName === 'EUR') return 'EUR';
  if (normalizedName === 'DOLAR' || normalizedName === 'USD' || normalizedName.includes('DOLAR')) return 'USD';
  return normalizedName.replace(/[^A-Z]/g, '').slice(0, 3) || `D${dovizTipi}`;
}

export function useCurrencyOptions(tarih?: Date, fiyatTipi = 1) {
  const { data: exchangeRates, isLoading, error } = useExchangeRate(tarih, fiyatTipi);

  const currencyOptions = useMemo((): CurrencyOption[] => {
    const options = (exchangeRates ?? [])
      .map((rate) => {
        const code = normalizeCurrencyCode(rate.dovizTipi, rate.dovizIsmi);
        const labelName = rate.dovizIsmi?.trim() || code;
        return {
          value: code,
          label: `${code} - ${labelName}`,
          code,
          dovizTipi: rate.dovizTipi,
          kurDegeri: rate.kurDegeri,
          dovizIsmi: rate.dovizIsmi,
        };
      })
      .filter((option, index, source) => source.findIndex((item) => item.code === option.code) === index)
      .sort((a, b) => {
        if (a.code === 'TRY') return -1;
        if (b.code === 'TRY') return 1;
        return a.code.localeCompare(b.code, 'tr');
      });

    return options.length > 0 ? options : defaultCurrencyOptions;
  }, [exchangeRates]);

  return {
    currencyOptions,
    isLoading,
    error,
  };
}
