export function logError(message: string, error?: unknown) {
  console.error(`[ERROR] ${message}`, error || '');
}

export function logInfo(message: string) {
  console.error(`[INFO] ${message}`);
}