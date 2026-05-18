import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hangfireMonitoringApi } from '../api/hangfireMonitoring.api';

const REFRESH_INTERVAL_MS = 60_000;

export const HANGFIRE_QUERY_KEYS = {
  all: ['hangfire-monitoring'] as const,
  stats: ['hangfire-monitoring', 'stats'] as const,
  failed: (from: number, count: number) => ['hangfire-monitoring', 'failed', from, count] as const,
  deadLetter: (from: number, count: number) => ['hangfire-monitoring', 'dead-letter', from, count] as const,
  successes: (from: number, count: number) => ['hangfire-monitoring', 'successes', from, count] as const,
  recurringJobs: ['hangfire-monitoring', 'recurring-jobs'] as const,
  manualSyncJobs: ['hangfire-monitoring', 'manual-sync-jobs'] as const,
};

export function useHangfireStatsQuery() {
  return useQuery({
    queryKey: HANGFIRE_QUERY_KEYS.stats,
    queryFn: () => hangfireMonitoringApi.getStats(),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useHangfireFailedJobsQuery(from: number, count: number) {
  return useQuery({
    queryKey: HANGFIRE_QUERY_KEYS.failed(from, count),
    queryFn: () => hangfireMonitoringApi.getFailed(from, count),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useHangfireDeadLetterQuery(from: number, count: number) {
  return useQuery({
    queryKey: HANGFIRE_QUERY_KEYS.deadLetter(from, count),
    queryFn: () => hangfireMonitoringApi.getDeadLetter(from, count),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useHangfireSuccessesQuery(from: number, count: number) {
  return useQuery({
    queryKey: HANGFIRE_QUERY_KEYS.successes(from, count),
    queryFn: () => hangfireMonitoringApi.getSuccesses(from, count),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useHangfireManualSyncJobsQuery() {
  return useQuery({
    queryKey: HANGFIRE_QUERY_KEYS.manualSyncJobs,
    queryFn: () => hangfireMonitoringApi.getManualSyncJobs(),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useHangfireRecurringJobsQuery() {
  return useQuery({
    queryKey: HANGFIRE_QUERY_KEYS.recurringJobs,
    queryFn: () => hangfireMonitoringApi.getRecurringJobs(),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useTriggerRecurringJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => hangfireMonitoringApi.triggerRecurringJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HANGFIRE_QUERY_KEYS.all });
    },
  });
}

export function useTriggerManualSyncMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobKey: string) => hangfireMonitoringApi.triggerManualSync(jobKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HANGFIRE_QUERY_KEYS.all });
    },
  });
}
