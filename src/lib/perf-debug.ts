const START_KEY = '__wmsPerfDebugStart';

function shouldLog(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return true;
  }

  try {
    return new URLSearchParams(window.location.search).get('perf') === '1';
  } catch {
    return false;
  }
}

export function startPerfDebug(label = 'bootstrap'): void {
  if (!shouldLog() || typeof performance === 'undefined') {
    return;
  }

  window[START_KEY as keyof Window] = performance.now() as never;
  console.log(`[perf] ${label}:start`);
}

export function logPerfDebug(step: string, details?: Record<string, unknown>): void {
  if (!shouldLog() || typeof performance === 'undefined') {
    return;
  }

  const start = (window[START_KEY as keyof Window] as number | undefined) ?? performance.now();
  const elapsed = Math.round(performance.now() - start);
  if (details) {
    console.log(`[perf] ${step}:${elapsed}ms`, details);
    return;
  }

  console.log(`[perf] ${step}:${elapsed}ms`);
}

export function endPerfDebug(label = 'bootstrap'): void {
  if (!shouldLog() || typeof performance === 'undefined') {
    return;
  }

  const start = (window[START_KEY as keyof Window] as number | undefined) ?? performance.now();
  const elapsed = Math.round(performance.now() - start);
  console.log(`[perf] ${label}:done:${elapsed}ms`);
}
