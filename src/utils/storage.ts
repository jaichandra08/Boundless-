import { Intent, IntentHistoryItem, IntentState, AppView } from '../types';
import { sanitizeIntentionText } from './text';
import { generateId } from './id';

const STORAGE_KEY = 'boundless_intents_v1';
const VISITED_KEY = 'boundless_has_visited_v1';
const ACTIVE_INTENT_KEY = 'boundless_active_intent_id_v1';
const ACTIVE_VIEW_KEY = 'boundless_active_view_v1';

const VALID_STATES: IntentState[] = ['INTENDED', 'MOVING', 'REAL', 'CLOSED'];

/**
 * Defensively normalizes an intent record from unknown data.
 * Returns null if the record is fundamentally corrupted or lacks content.
 */
export function normalizeIntent(raw: unknown): Intent | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;

  const rawText = typeof obj.originalIntent === 'string' ? obj.originalIntent : '';
  const sanitizedText = sanitizeIntentionText(rawText);
  if (!sanitizedText) return null;

  const currentState: IntentState = VALID_STATES.includes(obj.currentState as IntentState)
    ? (obj.currentState as IntentState)
    : 'INTENDED';

  const nextMove = typeof obj.nextMove === 'string' ? obj.nextMove.trim() : '';

  let history: IntentHistoryItem[] = [];
  if (Array.isArray(obj.history)) {
    history = obj.history
      .filter((h): h is Record<string, unknown> => Boolean(h && typeof h === 'object' && typeof h.text === 'string'))
      .map((h) => ({
        id: typeof h.id === 'string' && h.id ? h.id : generateId('hist'),
        intentId: String(obj.id).trim(),
        text: String(h.text),
        completedAt: typeof h.completedAt === 'string' ? h.completedAt : new Date().toISOString(),
        type: (['creation', 'state_change', 'move'].includes(h.type as string)
          ? h.type
          : 'move') as 'creation' | 'state_change' | 'move',
      }));
  }

  const now = new Date().toISOString();
  const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : now;
  const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : createdAt;

  // Strict Lifecycle Timestamp Invariants:
  // INTENDED: no realAt, no closedAt
  // MOVING: no realAt, no closedAt
  // REAL: realAt exists, no closedAt
  // CLOSED: realAt exists, closedAt exists
  let realAt: string | undefined = undefined;
  let closedAt: string | undefined = undefined;

  if (currentState === 'REAL') {
    realAt = typeof obj.realAt === 'string' ? obj.realAt : updatedAt;
  } else if (currentState === 'CLOSED') {
    realAt = typeof obj.realAt === 'string' ? obj.realAt : (typeof obj.closedAt === 'string' ? obj.closedAt : updatedAt);
    closedAt = typeof obj.closedAt === 'string' ? obj.closedAt : now;
  }

  return {
    id: obj.id.trim(),
    originalIntent: sanitizedText,
    currentState,
    nextMove,
    history,
    createdAt,
    updatedAt,
    realAt,
    closedAt,
  };
}

/**
 * Loads all intents with defensive deduplication strictly by ID.
 * Tolerates corrupted, missing, or malformed fields gracefully.
 * Text is NOT identity: Distinct intentions with identical wording are
 * completely preserved as separate unique objects.
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
      const normalized = normalizeIntent(item);
      if (!normalized) continue;

      const existing = map.get(normalized.id);
      if (
        !existing ||
        new Date(normalized.updatedAt || 0).getTime() >
          new Date(existing.updatedAt || 0).getTime()
      ) {
        map.set(normalized.id, normalized);
      }
    }

    const list = Array.from(map.values());

    return list.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );
  } catch (err) {
    console.warn('Failed to load intents from localStorage:', err);
    return [];
  }
}

/**
 * Saves a list of intents with strict deduplication by ID and defensive normalization.
 */
export function saveIntents(intents: Intent[]): void {
  try {
    const seen = new Set<string>();
    const deduped: Intent[] = [];
    for (const item of intents) {
      const normalized = normalizeIntent(item);
      if (!normalized || seen.has(normalized.id)) continue;
      seen.add(normalized.id);
      deduped.push(normalized);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
  } catch (err) {
    console.warn('Failed to save intents to localStorage:', err);
  }
}

export function getIntentById(id: string): Intent | undefined {
  if (!id) return undefined;
  const intents = loadIntents();
  return intents.find((i) => i.id === id);
}

/**
 * Persists a single intent without ever creating duplicates.
 * Updates in place if matching ID exists, or prepends if new.
 */
export function persistIntent(intent: Intent): void {
  const normalized = normalizeIntent(intent);
  if (!normalized) return;

  const current = loadIntents();
  const index = current.findIndex((i) => i.id === normalized.id);
  normalized.updatedAt = new Date().toISOString();

  if (index >= 0) {
    current[index] = normalized;
  } else {
    current.unshift(normalized);
  }

  saveIntents(current);
}

export function removeIntent(id: string): void {
  if (!id) return;
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
    // Ignore private browsing limitations
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
    // Ignore private browsing limitations
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
    // Ignore private browsing limitations
  }
}
