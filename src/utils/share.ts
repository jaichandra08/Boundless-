import { Intent } from '../types';
import { getCanonicalIntention } from './text';

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'failed';
  message: string;
}

/**
 * Encodes a canonical intention into a portable URL.
 * Contains only human-facing intention text — no UUIDs, internal storage keys, or debug data.
 */
export function createShareUrl(canonicalText: string): string {
  if (typeof window === 'undefined') return '';
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  return `${baseUrl}?share=${encodeURIComponent(canonicalText)}`;
}

/**
 * Decodes a portable shared intention from the current search params.
 * Returns null if no valid shared intention is found.
 */
export function getSharedIntentionFromUrl(search: string): string | null {
  if (!search) return null;
  try {
    const params = new URLSearchParams(search);
    const raw = params.get('share');
    if (!raw) return null;
    const decoded = decodeURIComponent(raw);
    const canonical = getCanonicalIntention(decoded);
    return canonical.length > 0 ? canonical : null;
  } catch {
    return null;
  }
}

export async function shareIntent(intent: Intent): Promise<ShareResult> {
  const canonical = getCanonicalIntention(intent.originalIntent);
  if (!canonical) {
    return { success: false, method: 'failed', message: 'No intention to share' };
  }

  const shareUrl = createShareUrl(canonical);
  const shareText = `BOUNDLESS: ${canonical}`;

  // Try native Web Share API first
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'BOUNDLESS',
        text: canonical,
        url: shareUrl,
      });
      return { success: true, method: 'native', message: 'Shared successfully' };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, method: 'native', message: 'Share dismissed' };
      }
    }
  }

  // Fallback: Clipboard copy of portable share link and canonical text
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      const copyPayload = shareUrl ? `${canonical}\n\n${shareUrl}` : canonical;
      await navigator.clipboard.writeText(copyPayload);
      return { success: true, method: 'clipboard', message: 'Copied link to clipboard' };
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  }

  return { success: false, method: 'failed', message: 'Sharing not supported on this device' };
}

