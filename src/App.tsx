import React, { useState, useEffect } from 'react';
import { Intent, AppView } from './types';
import {
  loadIntents,
  persistIntent,
  hasVisited,
  markVisited,
  getSavedActiveIntentId,
  setSavedActiveIntentId,
  getSavedView,
  setSavedView,
} from './utils/storage';
import { getCanonicalIntention } from './utils/text';
import { ArrivalView } from './components/ArrivalView';
import { CreateView } from './components/CreateView';
import { IntentLivingView } from './components/IntentLivingView';
import { HomeView } from './components/HomeView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Toast } from './components/Toast';

export default function App() {
  const [intents, setIntents] = useState<Intent[]>(() => loadIntents());
  const [activeIntentId, setActiveIntentId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedIntentId = params.get('intent');
      if (sharedIntentId) return sharedIntentId;
    }
    return getSavedActiveIntentId();
  });

  const [view, setView] = useState<AppView>(() => {
    const existing = loadIntents();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedIntentId = params.get('intent');
      if (sharedIntentId && existing.some((i) => i.id === sharedIntentId)) {
        return 'INTENT';
      }
    }

    const savedActiveId = getSavedActiveIntentId();
    if (savedActiveId && existing.some((i) => i.id === savedActiveId)) {
      return 'INTENT';
    }

    const savedView = getSavedView();
    if (savedView) {
      if (savedView === 'HOME' && existing.length === 0) return 'ARRIVAL';
      return savedView;
    }

    if (existing.length > 0 && hasVisited()) {
      return 'HOME';
    }
    return 'ARRIVAL';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize active intent ID and view to storage on change
  useEffect(() => {
    setSavedActiveIntentId(activeIntentId);
  }, [activeIntentId]);

  useEffect(() => {
    setSavedView(view);
  }, [view]);

  // Handle URL query param for shared intention
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedIntentId = params.get('intent');
      if (sharedIntentId) {
        const found = intents.find((i) => i.id === sharedIntentId);
        if (found) {
          setActiveIntentId(found.id);
          setView('INTENT');
        }
      }
    }
  }, [intents]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleStartFromArrival = () => {
    markVisited();
    setView('CREATE');
  };

  const handleCreateIntent = (intentText: string) => {
    const canonical = getCanonicalIntention(intentText);
    if (!canonical) return;

    // Defense against race condition: check if identical intent created in last 3s
    const existingRecent = intents.find(
      (i) =>
        i.originalIntent.toLowerCase() === canonical.toLowerCase() &&
        Date.now() - new Date(i.createdAt).getTime() < 3000
    );
    if (existingRecent) {
      setActiveIntentId(existingRecent.id);
      setView('INTENT');
      return;
    }

    const now = new Date().toISOString();
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `intent_${Date.now()}`;

    const newIntent: Intent = {
      id: newId,
      originalIntent: canonical,
      currentState: 'INTENDED',
      nextMove: '',
      history: [
        {
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `hist_${Date.now()}`,
          text: 'Intention articulated',
          completedAt: now,
          type: 'creation',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    persistIntent(newIntent);
    setIntents((prev) => {
      const deduped = prev.filter((i) => i.id !== newId);
      return [newIntent, ...deduped];
    });
    setActiveIntentId(newId);
    markVisited();
    setView('INTENT');
  };

  const handleUpdateIntent = (updated: Intent) => {
    persistIntent(updated);
    setIntents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const activeIntent = intents.find((i) => i.id === activeIntentId);

  return (
    <main className="min-h-[100dvh] bg-[#09090b] text-[#f4f4f6] relative flex flex-col font-sans">
      {/* Offline Status */}
      <OfflineIndicator />

      {/* Global Toast */}
      <Toast message={toastMessage} />

      {/* VIEW ROUTER */}
      {view === 'ARRIVAL' && (
        <ArrivalView
          onStart={handleStartFromArrival}
          onViewHome={() => setView('HOME')}
          hasExistingIntents={intents.length > 0}
        />
      )}

      {view === 'CREATE' && (
        <CreateView
          onBack={() => {
            if (intents.length > 0) {
              setView('HOME');
            } else {
              setView('ARRIVAL');
            }
          }}
          onSubmit={handleCreateIntent}
        />
      )}

      {view === 'INTENT' && (
        activeIntent ? (
          <IntentLivingView
            intent={activeIntent}
            onUpdateIntent={handleUpdateIntent}
            onCloseView={() => {
              setActiveIntentId(null);
              setView('HOME');
            }}
            onToast={showToast}
          />
        ) : (
          <HomeView
            intents={intents}
            onSelectIntent={(intent) => {
              setActiveIntentId(intent.id);
              setView('INTENT');
            }}
            onCreateNew={() => setView('CREATE')}
            onShowArrival={() => setView('ARRIVAL')}
          />
        )
      )}

      {view === 'HOME' && (
        <HomeView
          intents={intents}
          onSelectIntent={(intent) => {
            setActiveIntentId(intent.id);
            setView('INTENT');
          }}
          onCreateNew={() => setView('CREATE')}
          onShowArrival={() => setView('ARRIVAL')}
        />
      )}
    </main>
  );
}
