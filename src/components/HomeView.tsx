import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Plus } from 'lucide-react';
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
  // Deduplicate just in case any duplicate slipped into props
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
    <div className="relative min-h-[100dvh] flex flex-col justify-between px-6 py-8 sm:py-12 max-w-lg mx-auto">
      {/* Top Header: Understated Wordmark */}
      <div className="flex items-center justify-between w-full pb-4">
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

      {/* Center of Gravity: The Intentions Themselves */}
      <div className="flex-1 my-auto py-8 flex flex-col justify-center space-y-10">
        {livingIntents.length === 0 && realizedIntents.length === 0 ? (
          /* Empty State: Quiet void */
          <div className="text-center py-12 space-y-4">
            <p className="text-base font-light text-white/40">
              No intentions yet.
            </p>
            <button
              id="home-empty-create-btn"
              onClick={onCreateNew}
              className="text-xs font-mono tracking-widest text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-5 py-2.5 rounded-full transition cursor-pointer"
            >
              EXPRESS AN INTENTION
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Living Intentions */}
            {livingIntents.length > 0 && (
              <div className="space-y-4">
                {livingIntents.map((item) => {
                  const isMoving = item.currentState === 'MOVING';
                  const canonical = getCanonicalIntention(item.originalIntent);

                  return (
                    <motion.div
                      key={item.id}
                      id={`intent-item-${item.id}`}
                      onClick={() => onSelectIntent(item)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      className="group cursor-pointer py-4 border-b border-white/10 hover:border-white/25 transition-colors flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isMoving
                                ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)] animate-pulse'
                                : 'bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.7)]'
                            }`}
                          />
                          <span
                            className={`text-[9px] font-mono tracking-[0.25em] uppercase ${
                              isMoving ? 'text-sky-400' : 'text-white/40'
                            }`}
                          >
                            {isMoving ? 'MOVING' : 'INTENDED'}
                          </span>
                        </div>

                        <div className="text-xl sm:text-2xl font-light text-white leading-snug break-words">
                          {canonical}
                        </div>

                        {isMoving && item.nextMove && (
                          <div className="text-xs text-sky-400/80 font-light truncate pt-0.5">
                            ↳ {item.nextMove}
                          </div>
                        )}
                      </div>

                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/80 mt-2 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Realized Intentions: Quiet, settled in permanence */}
            {realizedIntents.length > 0 && (
              <div className="pt-4 space-y-3">
                <div className="text-[9px] font-mono tracking-[0.25em] text-white/25 uppercase px-0.5">
                  REALIZED
                </div>
                <div className="space-y-2">
                  {realizedIntents.map((item) => {
                    const canonical = getCanonicalIntention(item.originalIntent);

                    return (
                      <div
                        key={item.id}
                        id={`realized-item-${item.id}`}
                        onClick={() => onSelectIntent(item)}
                        className="group cursor-pointer py-2.5 flex items-center justify-between gap-3 text-white/40 hover:text-white/80 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
                          <span className="text-sm font-light truncate">
                            {canonical}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono tracking-widest text-white/20 group-hover:text-white/50 shrink-0">
                          {item.currentState}
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
          className="group flex items-center justify-center gap-2.5 w-full h-13 rounded-full border border-white/15 hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.06] text-white/90 hover:text-white font-mono text-xs tracking-widest uppercase transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition" />
          <span>NEW INTENTION</span>
        </button>
      </div>
    </div>
  );
};
