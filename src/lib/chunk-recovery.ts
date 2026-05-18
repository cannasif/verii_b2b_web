const CHUNK_RELOAD_KEY = 'wms:chunk-reload-at';
const CHUNK_RELOAD_COOLDOWN_MS = 30_000;

const CHUNK_ERROR_SUBSTRINGS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'Unable to preload CSS',
  'Loading chunk',
  'ChunkLoadError',
  'Failed to load module script',
  'Import failed',
] as const;

function collectErrorText(error: unknown): string {
  if (error instanceof Error) {
    const parts = [error.message];
    const cause = 'cause' in error && error.cause instanceof Error ? error.cause.message : '';
    if (cause) {
      parts.push(cause);
    }
    return parts.join(' ');
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return '';
  }
}

function isChunkLoadError(error: unknown): boolean {
  const message = collectErrorText(error);
  if (!message) {
    return false;
  }
  return CHUNK_ERROR_SUBSTRINGS.some((fragment) => message.includes(fragment));
}

function readLastReloadAt(): number {
  try {
    return Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? '0');
  } catch {
    return 0;
  }
}

function rememberReload(): void {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {
    return;
  }
}

export function tryRecoverFromChunkError(error: unknown): boolean {
  if (!isChunkLoadError(error)) {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const lastReloadAt = readLastReloadAt();
  if (Number.isFinite(lastReloadAt) && Date.now() - lastReloadAt < CHUNK_RELOAD_COOLDOWN_MS) {
    return false;
  }

  rememberReload();
  window.location.reload();
  return true;
}
