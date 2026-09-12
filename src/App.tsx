import React, { useState, useEffect, useRef } from 'react';
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
import { generateId } from './utils/id';
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

  // Navigate helper that pushes browser history cleanly without exposing internal IDs
  const navigateTo = (nextView: AppView, nextIntentId: string | null = null) => {
    setView(nextView);
    setActiveIntentId(nextIntentId);

    if (typeof window !== 'undefined') {
      window.history.pushState(
        { view: nextView, activeIntentId: nextIntentId },
        '',
        window.location.pathname
      );
    }
  };

  // Synchronize active intent ID and view to storage on change
  useEffect(() => {
    setSavedActiveIntentId(activeIntentId);
  }, [activeIntentId]);

  useEffect(() => {
    setSavedView(view);
  }, [view]);

  // Initial history state replacement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        { view, activeIntentId },
        '',
        window.location.pathname
      );
    }
  }, []);

  // Handle browser back / forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
        setActiveIntentId(event.state.activeIntentId || null);
      } else {
        const existing = loadIntents();
        if (existing.length > 0) {
          setView('HOME');
          setActiveIntentId(null);
        } else {
          setView('ARRIVAL');
          setActiveIntentId(null);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const isCreatingRef = useRef(false);
  const lastCreationRef = useRef<{ text: string; time: number } | null>(null);

  const handleStartFromArrival = () => {
    markVisited();
    navigateTo('CREATE', null);
  };

  const handleCreateIntent = (intentText: string) => {
    const canonical = getCanonicalIntention(intentText);
    if (!canonical) return;

    // Guard against synchronous double-invocations from the same user gesture
    if (isCreatingRef.current) return;

    // Guard against accidental rapid event duplication (< 600ms) for identical text from the same interaction
    const nowMs = Date.now();
    if (
      lastCreationRef.current &&
      lastCreationRef.current.text === canonical &&
      nowMs - lastCreationRef.current.time < 600
    ) {
      return;
    }

    isCreatingRef.current = true;
    lastCreationRef.current = { text: canonical, time: nowMs };

    const now = new Date().toISOString();
    const newId = generateId('intent');

    const newIntent: Intent = {
      id: newId,
      originalIntent: canonical,
      currentState: 'INTENDED',
      nextMove: '',
      history: [
        {
          id: generateId('hist'),
          intentId: newId,
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
    markVisited();
    navigateTo('INTENT', newId);

    setTimeout(() => {
      isCreatingRef.current = false;
    }, 120);
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
          onViewHome={() => navigateTo('HOME', null)}
          hasExistingIntents={intents.length > 0}
        />
      )}

      {view === 'CREATE' && (
        <CreateView
          onBack={() => {
            if (intents.length > 0) {
              navigateTo('HOME', null);
            } else {
              navigateTo('ARRIVAL', null);
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
              navigateTo('HOME', null);
            }}
            onToast={showToast}
          />
        ) : (
          <HomeView
            intents={intents}
            onSelectIntent={(intent) => {
              navigateTo('INTENT', intent.id);
            }}
            onCreateNew={() => navigateTo('CREATE', null)}
            onShowArrival={() => navigateTo('ARRIVAL', null)}
          />
        )
      )}

      {view === 'HOME' && (
        <HomeView
          intents={intents}
          onSelectIntent={(intent) => {
            navigateTo('INTENT', intent.id);
          }}
          onCreateNew={() => navigateTo('CREATE', null)}
          onShowArrival={() => navigateTo('ARRIVAL', null)}
        />
      )}
    </main>
  );
}
