import { Intent } from '../types';
import { getCanonicalIntention } from './text';

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'failed';
  message: string;
}

export async function shareIntent(intent: Intent): Promise<ShareResult> {
  const canonical = getCanonicalIntention(intent.originalIntent);
  const shareText = `BOUNDLESS: ${canonical}\nState: ${intent.currentState}`;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?intent=${intent.id}` : '';

  // Try native Web Share API first
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `BOUNDLESS: ${canonical}`,
        text: shareText,
        url: shareUrl,
      });
      return { success: true, method: 'native', message: 'Shared successfully' };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, method: 'native', message: 'Share dismissed' };
      }
    }
  }

  // Fallback: Clipboard copy
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      const copyPayload = shareUrl ? `${shareText}\n${shareUrl}` : shareText;
      await navigator.clipboard.writeText(copyPayload);
      return { success: true, method: 'clipboard', message: 'Copied link and intention to clipboard' };
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  }

  return { success: false, method: 'failed', message: 'Sharing not supported on this device' };
}
