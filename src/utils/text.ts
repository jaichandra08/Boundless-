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

  // If the string starts and ends with matching outer quotes, strip just the outer pair
  const quotePairs: [string, string][] = [
    ['"', '"'],
    ['“', '”'],
    ['“', '“'],
    ['”', '”'],
    ["'", "'"],
  ];

  for (const [open, close] of quotePairs) {
    if (trimmed.length >= 2 && trimmed.startsWith(open) && trimmed.endsWith(close)) {
      trimmed = trimmed.slice(open.length, trimmed.length - close.length).trim();
      break;
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
