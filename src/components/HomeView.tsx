import React from 'react';
import { motion } from 'motion/react';
import { Intent } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { getCanonicalIntention } from '../utils/text';

interface HomeViewProps {
  intents: Intent[];
  onSelectIntent: (intent: Intent) => void;
  onCreateNew: () => void;
  onShowArrival: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  intents,
  onSelectIntent,
  onCreateNew,
  onShowArrival,
}) => {
  // Strict deduplication by ID
  const seen = new Set<string>();
  const uniqueIntents = intents.filter((i) => {
    if (!i || !i.id || seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });

  const livingIntents = uniqueIntents.filter(
    (i) => i.currentState === 'INTENDED' || i.currentState === 'MOVING'
  );

  const realizedIntents = uniqueIntents.filter(
    (i) => i.currentState === 'REAL' || i.currentState === 'CLOSED'
  );

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between px-6 py-8 sm:py-12 max-w-lg mx-auto select-none">
      {/* Top Header: Understated Wordmark */}
      <div className="flex items-center justify-between w-full min-h-[40px]">
        <button
          id="home-brand-btn"
          onClick={onShowArrival}
          className="text-left group cursor-pointer"
          title="Return to arrival"
        >
          <span className="text-xs font-mono tracking-[0.3em] text-white/40 group-hover:text-white uppercase transition">
            BOUNDLESS
          </span>
        </button>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
        </div>
      </div>

      {/* Living Field: Intentions suspended in space */}
      <div className="flex-1 my-auto py-8 flex flex-col justify-center">
        {livingIntents.length === 0 && realizedIntents.length === 0 ? (
          /* Empty Void */
          <div className="text-center py-12 space-y-6">
            <p className="text-xl sm:text-2xl font-light text-white/50 tracking-tight">
              What do you want to happen?
            </p>
            <button
              id="home-empty-create-btn"
              onClick={onCreateNew}
              className="text-xs font-mono tracking-widest text-white/90 hover:text-white border border-white/20 hover:border-white/40 px-6 py-3 rounded-full transition cursor-pointer"
            >
              EXPRESS AN INTENTION
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Living Intentions */}
            {livingIntents.length > 0 && (
              <div className="space-y-8">
                {livingIntents.map((item) => {
                  const isMoving = item.currentState === 'MOVING';
                  const canonical = getCanonicalIntention(item.originalIntent);

                  return (
                    <motion.div
                      key={item.id}
                      id={`intent-item-${item.id}`}
                      onClick={() => onSelectIntent(item)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="group cursor-pointer p-4 -mx-4 rounded-2xl hover:bg-white/[0.03] transition-all duration-200"
                    >
                      <div className="flex items-start gap-4">
                        {/* Kinetic Orbital Node */}
                        <div className="pt-2 shrink-0">
                          <div
                            className={`relative flex items-center justify-center w-5 h-5 rounded-full ${
                              isMoving ? 'border border-sky-400/40 animate-spin-slow' : 'border border-white/20'
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isMoving
                                  ? 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]'
                                  : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Intention Body */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="text-2xl sm:text-3xl font-light text-white group-hover:text-white leading-snug tracking-tight break-words">
                            {canonical}
                          </div>

                          {isMoving && item.nextMove ? (
                            <div className="text-sm text-sky-400/80 font-light truncate">
                              ↳ {item.nextMove}
                            </div>
                          ) : (
                            <div className="text-[10px] font-mono tracking-[0.25em] text-white/30 uppercase">
                              {isMoving ? 'IN MOTION' : 'INTENDED'}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Realized Intentions: Quiet, settled in reality */}
            {realizedIntents.length > 0 && (
              <div className="pt-6 border-t border-white/5 space-y-3">
                <div className="text-[10px] font-mono tracking-[0.25em] text-white/30 uppercase">
                  REAL
                </div>
                <div className="space-y-1.5">
                  {realizedIntents.map((item) => {
                    const canonical = getCanonicalIntention(item.originalIntent);

                    return (
                      <div
                        key={item.id}
                        id={`realized-item-${item.id}`}
                        onClick={() => onSelectIntent(item)}
                        className="group cursor-pointer py-2.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.03] flex items-center justify-between gap-3 text-white/40 hover:text-white/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                          <span className="text-sm font-light text-white/60 group-hover:text-white truncate">
                            {canonical}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono tracking-widest text-white/30 shrink-0">
                          REAL
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary Action: Express a new intention */}
      <div className="w-full pb-safe pt-4">
        <button
          id="home-new-intent-btn"
          onClick={onCreateNew}
          className="group flex items-center justify-center gap-2.5 w-full h-14 rounded-full border border-white/15 hover:border-white/35 bg-white/[0.03] hover:bg-white/[0.07] text-white/90 hover:text-white font-mono text-xs tracking-widest uppercase transition cursor-pointer"
        >
          <span>EXPRESS AN INTENTION</span>
        </button>
      </div>
    </div>
  );
};
