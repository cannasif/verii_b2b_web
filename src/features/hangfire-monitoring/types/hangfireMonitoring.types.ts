export interface ManualSyncJobStatusDto {
  jobKey: string;
  jobName: string;
  lastTriggeredAtUtc?: string;
  nextAvailableAtUtc?: string;
  isCoolingDown: boolean;
  cooldownSecondsRemaining: number;
}

export interface HangfireStatsDto {
  enqueued: number;
  processing: number;
  scheduled: number;
  succeeded: number;
  failed: number;
  deleted: number;
  servers: number;
  queues: number;
  timestamp: string;
  manualSyncJobs: ManualSyncJobStatusDto[];
}

export interface HangfireRecurringJobItemDto {
  id: string;
  jobName: string;
  method?: string;
  cron?: string;
  queue?: string;
  nextExecution?: string;
  lastExecution?: string;
  lastJobId?: string;
  error?: string;
}

export interface HangfireRecurringJobsResponseDto {
  items: HangfireRecurringJobItemDto[];
  total: number;
  timestamp: string;
}

export interface HangfireTriggerRecurringJobResponseDto {
  jobId: string;
  triggeredAt: string;
  message: string;
}

export interface HangfireJobItemDto {
  jobId: string;
  recurringJobId?: string;
  jobName: string;
  failedAt?: string;
  enqueuedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  queue?: string;
  retryCount?: number;
  state?: string;
  reason?: string;
  technicalReason?: string;
}

export interface HangfireListResponseDto {
  items: HangfireJobItemDto[];
  total: number;
  timestamp: string;
}

export interface TriggerManualSyncJobResponseDto {
  jobKey: string;
  jobName: string;
  jobId: string;
  queue: string;
  enqueuedAtUtc: string;
  nextAvailableAtUtc?: string;
  cooldownSecondsRemaining: number;
}
