/**
 * Universal unique identifier generator.
 * Works across secure, non-secure, and sandboxed iframe environments.
 */
export function generateId(prefix = 'id'): string {
  let uniquePart = '';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      uniquePart = crypto.randomUUID();
    } catch {
      // Fallback if randomUUID throws in restricted iframe environments
    }
  }

  if (!uniquePart) {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).slice(2, 10);
    const performancePart =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? Math.floor(performance.now() * 1000).toString(36)
        : '';
    uniquePart = `${timestamp}${performancePart}_${randomPart}`;
  }

  return `${prefix}_${uniquePart}`;
}
