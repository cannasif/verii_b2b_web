import { getApiBaseUrl } from '@/lib/axios';

export function getStockImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;

  if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('data:')) {
    return relativePath;
  }

  const cleanBaseUrl = getApiBaseUrl().replace(/\/$/, '');
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${cleanBaseUrl}${cleanPath}`;
}
