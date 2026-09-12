export type IntentState = 'INTENDED' | 'MOVING' | 'REAL' | 'CLOSED';

export interface IntentHistoryItem {
  id: string;
  text: string;
  completedAt: string;
  type: 'creation' | 'state_change' | 'move';
}

export interface Intent {
  id: string;
  originalIntent: string;
  currentState: IntentState;
  nextMove: string;
  history: IntentHistoryItem[];
  createdAt: string;
  updatedAt: string;
  realAt?: string;
  closedAt?: string;
}

export type AppView = 'ARRIVAL' | 'CREATE' | 'INTENT' | 'HOME';
