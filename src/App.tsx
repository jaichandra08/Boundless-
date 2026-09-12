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
import { getSharedIntentionFromUrl } from './utils/share';
import { ArrivalView } from './components/ArrivalView';
import { CreateView } from './components/CreateView';
import { IntentLivingView } from './components/IntentLivingView';
import { HomeView } from './components/HomeView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Toast } from './components/Toast';

export default function App() {
  const [intents, setIntents] = useState<Intent[]>(() => loadIntents());
  const [pendingSharedIntention, setPendingSharedIntention] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return getSharedIntentionFromUrl(window.location.search);
    }
    return null;
  });

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
      const existing = loadIntents();
      if (event.state && event.state.view) {
        const nextView = event.state.view as AppView;
        const nextId = event.state.activeIntentId || null;
        if (nextView === 'INTENT' && (!nextId || !existing.some((i) => i.id === nextId))) {
          setView(existing.length > 0 ? 'HOME' : 'ARRIVAL');
          setActiveIntentId(null);
        } else {
          setView(nextView);
          setActiveIntentId(nextId);
        }
      } else {
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

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const isCreatingRef = useRef(false);

  const handleStartFromArrival = () => {
    markVisited();
    navigateTo('CREATE', null);
  };

  const handleCreateIntent = (intentText: string) => {
    const canonical = getCanonicalIntention(intentText);
    if (!canonical) return;

    // Guard against synchronous double-invocations from the same physical gesture
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;
    setTimeout(() => {
      isCreatingRef.current = false;
    }, 250);

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
    setIntents((prev) => [newIntent, ...prev.filter((i) => i.id !== newId)]);
    markVisited();
    navigateTo('INTENT', newId);
  };

  const handleAdoptSharedIntention = () => {
    if (!pendingSharedIntention) return;
    const text = pendingSharedIntention;
    setPendingSharedIntention(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
    handleCreateIntent(text);
  };

  const handleDismissSharedIntention = () => {
    setPendingSharedIntention(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
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

      {/* Shared Intention Modal: Clean, explicit recipient adoption without auto-injection */}
      {pendingSharedIntention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#121318] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 text-center select-none shadow-2xl">
            <div className="text-[10px] font-mono tracking-[0.25em] text-white/40 uppercase">
              SHARED INTENTION
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-white leading-snug break-words">
              {pendingSharedIntention}
            </h2>
            <p className="text-xs font-mono text-white/40 tracking-wide">
              A human shared this intention with you.
            </p>
            <div className="space-y-3 pt-2">
              <button
                id="adopt-shared-intent-btn"
                onClick={handleAdoptSharedIntention}
                className="w-full h-14 rounded-full bg-white text-black font-semibold text-xs font-mono tracking-widest uppercase hover:bg-white/95 active:scale-[0.98] transition cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                MAKE IT REAL
              </button>
              <button
                id="dismiss-shared-intent-btn"
                onClick={handleDismissSharedIntention}
                className="w-full h-11 rounded-full text-xs font-mono tracking-widest text-white/40 hover:text-white transition cursor-pointer"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

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
