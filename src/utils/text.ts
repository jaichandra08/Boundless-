/**
 * Canonical text handling for BOUNDLESS.
 * 
 * Rules:
 * 1. Store the user's raw intention exactly once.
 * 2. Never inject decorative quotation marks into persisted data.
 * 3. Preserve capitalization and punctuation exactly as entered.
 * 4. Single canonical rendering path for intention text so Create,
 *    Intended, Moving, Real, Closed, Home, and Share never corrupt or double-quote.
 */

/**
 * Strips accidental outer matching quotation marks if the user copy-pasted a quoted string,
 * while strictly preserving all internal capitalization, punctuation, and wording.
 */
export function sanitizeIntentionText(raw: string): string {
  if (!raw) return '';
  let trimmed = raw.trim();

  // If the string starts and ends with matching outer quotes, safely strip nested accidental outer pairs
  const quotePairs: [string, string][] = [
    ['"', '"'],
    ['“', '”'],
    ['“', '“'],
    ['”', '”'],
    ["'", "'"],
  ];

  let changed = true;
  while (changed && trimmed.length >= 2) {
    changed = false;
    for (const [open, close] of quotePairs) {
      if (
        trimmed.startsWith(open) &&
        trimmed.endsWith(close) &&
        trimmed.length >= open.length + close.length
      ) {
        trimmed = trimmed.slice(open.length, trimmed.length - close.length).trim();
        changed = true;
        break;
      }
    }
  }

  return trimmed;
}

/**
 * Canonical getter for displaying an intention.
 * Ensures clean, raw text is shown without injected or repeated quotes.
 */
export function getCanonicalIntention(text: string): string {
  return sanitizeIntentionText(text);
}
