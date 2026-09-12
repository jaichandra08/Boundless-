import { Intent, AppView } from '../types';
import { sanitizeIntentionText } from './text';

const STORAGE_KEY = 'boundless_intents_v1';
const VISITED_KEY = 'boundless_has_visited_v1';
const ACTIVE_INTENT_KEY = 'boundless_active_intent_id_v1';
const ACTIVE_VIEW_KEY = 'boundless_active_view_v1';

/**
 * Loads all intents with defensive deduplication by ID.
 * Preserves exact raw text and canonical state.
 */
export function loadIntents(): Intent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Deduplicate strictly by ID, taking the most recently updated entry
    const map = new Map<string, Intent>();
    for (const item of parsed) {
      if (!item || typeof item !== 'object' || !item.id) continue;
      const sanitized: Intent = {
        ...item,
        originalIntent: sanitizeIntentionText(item.originalIntent || ''),
      };
      const existing = map.get(item.id);
      if (!existing || new Date(sanitized.updatedAt || 0).getTime() > new Date(existing.updatedAt || 0).getTime()) {
        map.set(item.id, sanitized);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
  } catch (err) {
    console.warn('Failed to load intents from localStorage:', err);
    return [];
  }
}

/**
 * Saves a list of intents with strict deduplication by ID.
 */
export function saveIntents(intents: Intent[]): void {
  try {
    const seen = new Set<string>();
    const deduped: Intent[] = [];
    for (const item of intents) {
      if (!item || !item.id || seen.has(item.id)) continue;
      seen.add(item.id);
      deduped.push({
        ...item,
        originalIntent: sanitizeIntentionText(item.originalIntent || ''),
      });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
  } catch (err) {
    console.warn('Failed to save intents to localStorage:', err);
  }
}

export function getIntentById(id: string): Intent | undefined {
  const intents = loadIntents();
  return intents.find((i) => i.id === id);
}

/**
 * Persists a single intent without ever creating duplicates.
 * Updates in place if matching ID exists, or prepends if new.
 */
export function persistIntent(intent: Intent): void {
  if (!intent || !intent.id) return;

  const current = loadIntents();
  const index = current.findIndex((i) => i.id === intent.id);
  const now = new Date().toISOString();
  const sanitized: Intent = {
    ...intent,
    originalIntent: sanitizeIntentionText(intent.originalIntent || ''),
    updatedAt: now,
  };

  if (index >= 0) {
    current[index] = sanitized;
  } else {
    current.unshift(sanitized);
  }

  saveIntents(current);
}

export function removeIntent(id: string): void {
  const intents = loadIntents().filter((i) => i.id !== id);
  saveIntents(intents);
}

export function hasVisited(): boolean {
  try {
    return localStorage.getItem(VISITED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markVisited(): void {
  try {
    localStorage.setItem(VISITED_KEY, 'true');
  } catch {
    // Ignore
  }
}

/**
 * Session persistence across refreshes
 */
export function getSavedActiveIntentId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_INTENT_KEY);
  } catch {
    return null;
  }
}

export function setSavedActiveIntentId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_INTENT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_INTENT_KEY);
    }
  } catch {
    // Ignore
  }
}

export function getSavedView(): AppView | null {
  try {
    const v = localStorage.getItem(ACTIVE_VIEW_KEY);
    if (v === 'ARRIVAL' || v === 'CREATE' || v === 'INTENT' || v === 'HOME') {
      return v;
    }
    return null;
  } catch {
    return null;
  }
}

export function setSavedView(view: AppView): void {
  try {
    localStorage.setItem(ACTIVE_VIEW_KEY, view);
  } catch {
    // Ignore
  }
}
