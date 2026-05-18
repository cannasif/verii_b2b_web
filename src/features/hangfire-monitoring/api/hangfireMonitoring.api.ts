import { api } from '@/lib/axios';
import type {
  HangfireJobItemDto,
  HangfireListResponseDto,
  HangfireRecurringJobItemDto,
  HangfireRecurringJobsResponseDto,
  HangfireStatsDto,
  HangfireTriggerRecurringJobResponseDto,
  ManualSyncJobStatusDto,
  TriggerManualSyncJobResponseDto,
} from '../types/hangfireMonitoring.types';

function valueOf(row: Record<string, unknown>, pascal: string, camel: string): unknown {
  return row[pascal] ?? row[camel];
}

function normalizeManualSyncJobs(items: unknown): ManualSyncJobStatusDto[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    return {
      jobKey: String(valueOf(row, 'JobKey', 'jobKey') ?? ''),
      jobName: String(valueOf(row, 'JobName', 'jobName') ?? ''),
      lastTriggeredAtUtc: valueOf(row, 'LastTriggeredAtUtc', 'lastTriggeredAtUtc') ? String(valueOf(row, 'LastTriggeredAtUtc', 'lastTriggeredAtUtc')) : undefined,
      nextAvailableAtUtc: valueOf(row, 'NextAvailableAtUtc', 'nextAvailableAtUtc') ? String(valueOf(row, 'NextAvailableAtUtc', 'nextAvailableAtUtc')) : undefined,
      isCoolingDown: Boolean(valueOf(row, 'IsCoolingDown', 'isCoolingDown') ?? false),
      cooldownSecondsRemaining: Number(valueOf(row, 'CooldownSecondsRemaining', 'cooldownSecondsRemaining') ?? 0),
    };
  });
}

function normalizeStats(data: Record<string, unknown>): HangfireStatsDto {
  return {
    enqueued: Number(valueOf(data, 'Enqueued', 'enqueued') ?? 0),
    processing: Number(valueOf(data, 'Processing', 'processing') ?? 0),
    scheduled: Number(valueOf(data, 'Scheduled', 'scheduled') ?? 0),
    succeeded: Number(valueOf(data, 'Succeeded', 'succeeded') ?? 0),
    failed: Number(valueOf(data, 'Failed', 'failed') ?? 0),
    deleted: Number(valueOf(data, 'Deleted', 'deleted') ?? 0),
    servers: Number(valueOf(data, 'Servers', 'servers') ?? 0),
    queues: Number(valueOf(data, 'Queues', 'queues') ?? 0),
    timestamp: String(valueOf(data, 'Timestamp', 'timestamp') ?? new Date().toISOString()),
    manualSyncJobs: normalizeManualSyncJobs(valueOf(data, 'ManualSyncJobs', 'manualSyncJobs')),
  };
}

function normalizeJobs(items: unknown): HangfireJobItemDto[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    return {
      jobId: String(valueOf(row, 'JobId', 'jobId') ?? ''),
      recurringJobId: valueOf(row, 'RecurringJobId', 'recurringJobId') ? String(valueOf(row, 'RecurringJobId', 'recurringJobId')) : undefined,
      jobName: String(valueOf(row, 'JobName', 'jobName') ?? 'unknown'),
      failedAt: valueOf(row, 'FailedAt', 'failedAt') ? String(valueOf(row, 'FailedAt', 'failedAt')) : undefined,
      enqueuedAt: valueOf(row, 'EnqueuedAt', 'enqueuedAt') ? String(valueOf(row, 'EnqueuedAt', 'enqueuedAt')) : undefined,
      finishedAt: valueOf(row, 'FinishedAt', 'finishedAt') ? String(valueOf(row, 'FinishedAt', 'finishedAt')) : undefined,
      durationMs: Number(valueOf(row, 'DurationMs', 'durationMs') ?? 0),
      queue: valueOf(row, 'Queue', 'queue') ? String(valueOf(row, 'Queue', 'queue')) : undefined,
      retryCount: Number(valueOf(row, 'RetryCount', 'retryCount') ?? 0),
      state: valueOf(row, 'State', 'state') ? String(valueOf(row, 'State', 'state')) : undefined,
      reason: valueOf(row, 'Reason', 'reason') ? String(valueOf(row, 'Reason', 'reason')) : undefined,
      technicalReason: valueOf(row, 'TechnicalReason', 'technicalReason') ? String(valueOf(row, 'TechnicalReason', 'technicalReason')) : undefined,
    };
  });
}

function normalizeRecurringJobs(items: unknown): HangfireRecurringJobItemDto[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    return {
      id: String(valueOf(row, 'Id', 'id') ?? ''),
      jobName: String(valueOf(row, 'JobName', 'jobName') ?? valueOf(row, 'Id', 'id') ?? 'unknown'),
      method: valueOf(row, 'Method', 'method') ? String(valueOf(row, 'Method', 'method')) : undefined,
      cron: valueOf(row, 'Cron', 'cron') ? String(valueOf(row, 'Cron', 'cron')) : undefined,
      queue: valueOf(row, 'Queue', 'queue') ? String(valueOf(row, 'Queue', 'queue')) : undefined,
      nextExecution: valueOf(row, 'NextExecution', 'nextExecution') ? String(valueOf(row, 'NextExecution', 'nextExecution')) : undefined,
      lastExecution: valueOf(row, 'LastExecution', 'lastExecution') ? String(valueOf(row, 'LastExecution', 'lastExecution')) : undefined,
      lastJobId: valueOf(row, 'LastJobId', 'lastJobId') ? String(valueOf(row, 'LastJobId', 'lastJobId')) : undefined,
      error: valueOf(row, 'Error', 'error') ? String(valueOf(row, 'Error', 'error')) : undefined,
    };
  });
}

function normalizeList(data: Record<string, unknown>): HangfireListResponseDto {
  return {
    items: normalizeJobs(valueOf(data, 'Items', 'items')),
    total: Number(valueOf(data, 'Total', 'total') ?? valueOf(data, 'Enqueued', 'enqueued') ?? 0),
    timestamp: String(valueOf(data, 'Timestamp', 'timestamp') ?? new Date().toISOString()),
  };
}

export const hangfireMonitoringApi = {
  async getStats(): Promise<HangfireStatsDto> {
    const response = await api.get<Record<string, unknown>>('/api/hangfire/stats');
    return normalizeStats(response ?? {});
  },
  async getFailed(from = 0, count = 10): Promise<HangfireListResponseDto> {
    const response = await api.get<Record<string, unknown>>(`/api/hangfire/failures-from-db?from=${from}&count=${count}`);
    return normalizeList(response ?? {});
  },
  async getDeadLetter(from = 0, count = 10): Promise<HangfireListResponseDto> {
    const response = await api.get<Record<string, unknown>>(`/api/hangfire/dead-letter?from=${from}&count=${count}`);
    return normalizeList(response ?? {});
  },
  async getSuccesses(from = 0, count = 10): Promise<HangfireListResponseDto> {
    const response = await api.get<Record<string, unknown>>(`/api/hangfire/successes-from-db?from=${from}&count=${count}`);
    return normalizeList(response ?? {});
  },
  async getManualSyncJobs(): Promise<ManualSyncJobStatusDto[]> {
    const response = await api.get<{ data?: ManualSyncJobStatusDto[]; Data?: ManualSyncJobStatusDto[] }>('/api/hangfire/manual-sync/jobs');
    return normalizeManualSyncJobs(response.data ?? response.Data);
  },
  async getRecurringJobs(): Promise<HangfireRecurringJobsResponseDto> {
    const response = await api.get<Record<string, unknown>>('/api/hangfire/recurring-jobs');
    return {
      items: normalizeRecurringJobs(valueOf(response ?? {}, 'Items', 'items')),
      total: Number(valueOf(response ?? {}, 'Total', 'total') ?? 0),
      timestamp: String(valueOf(response ?? {}, 'Timestamp', 'timestamp') ?? new Date().toISOString()),
    };
  },
  async triggerRecurringJob(jobId: string): Promise<HangfireTriggerRecurringJobResponseDto> {
    const response = await api.post<Record<string, unknown>>(`/api/hangfire/recurring-jobs/${encodeURIComponent(jobId)}/trigger`);
    return {
      jobId: String(valueOf(response ?? {}, 'JobId', 'jobId') ?? jobId),
      triggeredAt: String(valueOf(response ?? {}, 'TriggeredAt', 'triggeredAt') ?? new Date().toISOString()),
      message: String(valueOf(response ?? {}, 'Message', 'message') ?? 'Recurring job triggered successfully.'),
    };
  },
  async triggerManualSync(jobKey: string): Promise<TriggerManualSyncJobResponseDto> {
    const response = await api.post<{ data?: Record<string, unknown>; Data?: Record<string, unknown> }>('/api/hangfire/manual-sync/run', { jobKey });
    const data = response.data ?? response.Data ?? {};
    return {
      jobKey: String(valueOf(data, 'JobKey', 'jobKey') ?? ''),
      jobName: String(valueOf(data, 'JobName', 'jobName') ?? ''),
      jobId: String(valueOf(data, 'JobId', 'jobId') ?? ''),
      queue: String(valueOf(data, 'Queue', 'queue') ?? 'default'),
      enqueuedAtUtc: String(valueOf(data, 'EnqueuedAtUtc', 'enqueuedAtUtc') ?? new Date().toISOString()),
      nextAvailableAtUtc: valueOf(data, 'NextAvailableAtUtc', 'nextAvailableAtUtc') ? String(valueOf(data, 'NextAvailableAtUtc', 'nextAvailableAtUtc')) : undefined,
      cooldownSecondsRemaining: Number(valueOf(data, 'CooldownSecondsRemaining', 'cooldownSecondsRemaining') ?? 0),
    };
  },
};
