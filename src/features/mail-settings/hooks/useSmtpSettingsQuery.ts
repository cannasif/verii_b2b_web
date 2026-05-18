import { useQuery } from '@tanstack/react-query';
import { smtpSettingsApi } from '../api/smtpSettingsApi';

const SMTP_SETTINGS_QUERY_KEY = ['smtp-settings'] as const;
const STALE_TIME_MS = 60 * 1000;

export function useSmtpSettingsQuery() {
  return useQuery({
    queryKey: SMTP_SETTINGS_QUERY_KEY,
    queryFn: () => smtpSettingsApi.get(),
    staleTime: STALE_TIME_MS,
  });
}
