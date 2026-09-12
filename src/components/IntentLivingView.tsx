import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Share2, RotateCcw } from 'lucide-react';
import { Intent, IntentHistoryItem } from '../types';
import { shareIntent } from '../utils/share';
import { OrbitalGlyph } from './OrbitalGlyph';
import { getCanonicalIntention } from '../utils/text';

interface IntentLivingViewProps {
  intent: Intent;
  onUpdateIntent: (updated: Intent) => void;
  onCloseView: () => void;
  onToast: (msg: string) => void;
}

export const IntentLivingView: React.FC<IntentLivingViewProps> = ({
  intent,
  onUpdateIntent,
  onCloseView,
  onToast,
}) => {
  const [moveInput, setMoveInput] = useState('');
  const canonicalIntent = getCanonicalIntention(intent.originalIntent);

  const handleShare = async () => {
    const result = await shareIntent(intent);
    if (result.message && result.method !== 'failed') {
      onToast(result.message);
    }
  };

  // Immediate physical transition: INTENDED -> MOVING
  const handleMoveIt = () => {
    const now = new Date().toISOString();
    const historyItem: IntentHistoryItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hist_${Date.now()}`,
      text: 'Put into motion',
      completedAt: now,
      type: 'state_change',
    };
    const updated: Intent = {
      ...intent,
      currentState: 'MOVING',
      updatedAt: now,
      history: [...intent.history, historyItem],
    };
    onUpdateIntent(updated);
  };

  // Set active movement in MOVING state
  const handleStartMove = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = moveInput.trim();
    if (!trimmed) return;

    const now = new Date().toISOString();
    const updated: Intent = {
      ...intent,
      nextMove: trimmed,
      updatedAt: now,
    };
    onUpdateIntent(updated);
    setMoveInput('');
  };

  // Complete current movement in the real world: "DONE"
  // Records the move as an evolutionary step, NOT automatically making the intent REAL
  const handleCompleteMove = () => {
    if (!intent.nextMove) return;

    const now = new Date().toISOString();
    const historyItem: IntentHistoryItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hist_${Date.now()}`,
      text: intent.nextMove,
      completedAt: now,
      type: 'move',
    };

    const updated: Intent = {
      ...intent,
      nextMove: '',
      history: [...intent.history, historyItem],
      updatedAt: now,
    };
    onUpdateIntent(updated);
    onToast('Moved forward.');
  };

  // Transition to REAL: The intended reality actually became true
  const handleMarkReal = () => {
    const now = new Date().toISOString();
    const historyItem: IntentHistoryItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hist_${Date.now()}`,
      text: 'Reality achieved',
      completedAt: now,
      type: 'state_change',
    };
    const updated: Intent = {
      ...intent,
      currentState: 'REAL',
      nextMove: '',
      realAt: now,
      updatedAt: now,
      history: [...intent.history, historyItem],
    };
    onUpdateIntent(updated);
  };

  // Close intent: REAL -> CLOSED (permanence)
  const handleCloseIntent = () => {
    const now = new Date().toISOString();
    const historyItem: IntentHistoryItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hist_${Date.now()}`,
      text: 'Preserved into permanence',
      completedAt: now,
      type: 'state_change',
    };
    const updated: Intent = {
      ...intent,
      currentState: 'CLOSED',
      closedAt: now,
      updatedAt: now,
      history: [...intent.history, historyItem],
    };
    onUpdateIntent(updated);
    onCloseView();
  };

  // Reopen intent: CLOSED -> MOVING
  const handleReopen = () => {
    const now = new Date().toISOString();
    const historyItem: IntentHistoryItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hist_${Date.now()}`,
      text: 'Returned to motion',
      completedAt: now,
      type: 'state_change',
    };
    const updated: Intent = {
      ...intent,
      currentState: 'MOVING',
      updatedAt: now,
      history: [...intent.history, historyItem],
    };
    onUpdateIntent(updated);
    onToast('Returned to motion.');
  };

  const completedMoves = intent.history.filter((h) => h.type === 'move');
  const hasActiveMove = Boolean(intent.nextMove && intent.nextMove.trim().length > 0);

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between px-6 py-8 sm:py-12 max-w-lg mx-auto">
      {/* Top Bar Navigation & Actions */}
      <div className="flex items-center justify-between w-full min-h-[40px]">
        <button
          id="intent-back-btn"
          onClick={onCloseView}
          className="flex items-center gap-2 text-xs font-mono tracking-widest text-white/40 hover:text-white transition p-2 -ml-2 rounded-lg cursor-pointer"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>HOME</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            id="intent-share-btn"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-mono tracking-widest text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 transition cursor-pointer"
            aria-label="Share Intent"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main Living Object Canvas */}
      <div className="my-auto py-6">
        <AnimatePresence mode="wait">
          {/* STATE 1: INTENDED — Stable Potential */}
          {intent.currentState === 'INTENDED' && (
            <motion.div
              key="intended-state"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center select-none"
            >
              {/* Semantic Orbital Visual: Crystalline INTENDED State */}
              <div className="mb-8">
                <OrbitalGlyph state="INTENDED" size="lg" />
              </div>

              {/* State Indicator */}
              <div className="text-[11px] font-mono tracking-[0.3em] text-white/40 uppercase mb-4">
                INTENDED
              </div>

              {/* Monolithic Intention Object */}
              <h1
                id="intent-display-title"
                className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white leading-tight max-w-md break-words"
              >
                {canonicalIntent}
              </h1>
            </motion.div>
          )}

          {/* STATE 2: MOVING — Active Transformation */}
          {intent.currentState === 'MOVING' && (
            <motion.div
              key="moving-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col text-left"
            >
              {/* Header with Semantic Orbital Visual in Kinetic Motion */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <OrbitalGlyph state="MOVING" size="sm" />
                  <div>
                    <div className="text-[11px] font-mono tracking-[0.25em] text-sky-400 uppercase font-medium">
                      MOVING
                    </div>
                    <div className="text-[10px] font-mono text-white/30 tracking-wider">
                      IN MOTION
                    </div>
                  </div>
                </div>
              </div>

              {/* Prominent Intention Display */}
              <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white leading-snug break-words mb-8">
                {canonicalIntent}
              </h2>

              {/* Movement in Flight OR Next Movement Input */}
              <div className="mb-6">
                {hasActiveMove ? (
                  /* Active move in progress: The single primary action is to complete it */
                  <div className="border-l-2 border-sky-400 pl-4 py-1 space-y-4">
                    <div className="text-[10px] font-mono tracking-[0.25em] text-sky-400 uppercase">
                      IN MOTION
                    </div>
                    <div className="text-xl sm:text-2xl font-light text-white leading-relaxed">
                      {intent.nextMove}
                    </div>
                    <button
                      id="complete-move-btn"
                      onClick={handleCompleteMove}
                      className="group flex items-center justify-center gap-2.5 w-full h-13 rounded-full bg-white text-black font-semibold text-xs font-mono tracking-widest uppercase hover:bg-white/95 active:scale-[0.99] transition shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer mt-4"
                    >
                      <span>DONE</span>
                    </button>
                  </div>
                ) : (
                  /* No active move in flight: prompt for next movement */
                  <div className="space-y-4">
                    <label
                      htmlFor="next-move-input"
                      className="text-lg sm:text-xl font-light text-white/90 leading-snug block"
                    >
                      What would move this forward?
                    </label>
                    <form onSubmit={handleStartMove} className="space-y-4">
                      <input
                        id="next-move-input"
                        type="text"
                        value={moveInput}
                        onChange={(e) => setMoveInput(e.target.value)}
                        placeholder="Something small enough to do next…"
                        className="w-full bg-transparent border-0 border-b border-white/20 focus:border-sky-400/80 p-2 text-base sm:text-lg text-white placeholder-white/25 outline-none transition duration-150 font-light"
                        autoFocus
                      />
                      <button
                        id="set-move-btn"
                        type="submit"
                        disabled={!moveInput.trim()}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 disabled:opacity-20 text-xs font-mono tracking-widest uppercase text-white transition cursor-pointer"
                      >
                        <span>MOVE</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Recorded Evolution Trail: Physical trajectory of reality shifting */}
              {completedMoves.length > 0 && (
                <div className="mt-4 pt-6 border-t border-white/10 space-y-3">
                  <div className="text-[10px] font-mono tracking-[0.2em] text-white/30 uppercase">
                    EVOLUTION
                  </div>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                    {completedMoves.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-start gap-3 text-xs sm:text-sm text-white/70 font-light"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400/70 mt-1.5 shrink-0" />
                        <span className="leading-relaxed break-words">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STATE 3: REAL — Resolution & Convergence */}
          {intent.currentState === 'REAL' && (
            <motion.div
              key="real-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center py-4 select-none"
            >
              {/* Semantic Orbital Visual: Full Luminous Singularity */}
              <div className="mb-6">
                <OrbitalGlyph state="REAL" size="lg" />
              </div>

              {/* "IT’S REAL." */}
              <h1
                id="real-heading"
                className="text-4xl sm:text-5xl font-extrabold tracking-[0.2em] text-white uppercase mb-2"
              >
                IT’S REAL.
              </h1>

              {/* "You changed something." */}
              <p
                id="real-subheading"
                className="text-lg sm:text-xl font-light text-white/70 tracking-wide mb-8"
              >
                You changed something.
              </p>

              {/* Manifested Intention & Evolution History */}
              <div className="w-full text-left p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="text-[10px] font-mono tracking-[0.25em] text-white/40 uppercase">
                  THE INTENTION
                </div>
                <div className="text-xl font-light text-white break-words">
                  {canonicalIntent}
                </div>

                {completedMoves.length > 0 && (
                  <div className="pt-4 border-t border-white/10 space-y-2.5">
                    <div className="text-[10px] font-mono tracking-[0.25em] text-white/40 uppercase">
                      EVOLUTION PATHWAY
                    </div>
                    <div className="space-y-2 text-xs sm:text-sm text-white/70 font-light max-h-36 overflow-y-auto">
                      {completedMoves.map((m, idx) => (
                        <div key={m.id || idx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                          <span>{m.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STATE 4: CLOSED — Quiet Artifact of Permanence */}
          {intent.currentState === 'CLOSED' && (
            <motion.div
              key="closed-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center py-4"
            >
              <div className="mb-6">
                <OrbitalGlyph state="CLOSED" size="md" />
              </div>

              <div className="text-[10px] font-mono tracking-[0.3em] text-white/40 uppercase mb-3">
                REALIZED
              </div>

              <h2 className="text-2xl sm:text-3xl font-light text-white/90 mb-3 break-words">
                {canonicalIntent}
              </h2>

              <p className="text-xs font-mono text-white/40 tracking-wider mb-6">
                Manifested and preserved in permanence.
              </p>

              {completedMoves.length > 0 && (
                <div className="w-full text-left bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-6 space-y-3">
                  <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
                    RECORDED EVOLUTION
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {completedMoves.map((m, idx) => (
                      <div key={m.id || idx} className="flex items-start gap-2.5 text-xs text-white/60 font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 shrink-0" />
                        <span>{m.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                id="reopen-intent-btn"
                onClick={handleReopen}
                className="flex items-center gap-2 text-xs font-mono tracking-widest text-white/50 hover:text-white border border-white/10 hover:border-white/25 px-4 py-2.5 rounded-full transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RETURN TO MOTION</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Primary Action Bar */}
      <div className="w-full flex flex-col gap-3 pb-safe pt-2">
        {/* In INTENDED: "MOVE IT →" */}
        {intent.currentState === 'INTENDED' && (
          <button
            id="move-it-primary-btn"
            onClick={handleMoveIt}
            className="group flex items-center justify-center gap-3 w-full h-14 rounded-full bg-white text-black font-semibold text-sm tracking-widest uppercase hover:bg-white/95 active:scale-[0.98] transition shadow-[0_0_25px_rgba(255,255,255,0.16)] cursor-pointer"
          >
            <span>MOVE IT</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}

        {/* In MOVING:
            If NO active move in flight: User can declare reality is achieved: "THIS IS REAL →"
            If active move IS in flight: The primary action on screen is DONE (above). No conflicting duplicate CTA here!
        */}
        {intent.currentState === 'MOVING' && !hasActiveMove && (
          <button
            id="mark-real-btn"
            onClick={handleMarkReal}
            className="group flex items-center justify-center gap-2.5 w-full h-14 rounded-full border border-white/20 hover:border-white/40 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-xs font-mono tracking-widest uppercase transition cursor-pointer"
          >
            <span>THIS IS REAL</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}

        {/* In REAL: "CLOSE INTENT" */}
        {intent.currentState === 'REAL' && (
          <button
            id="close-intent-primary-btn"
            onClick={handleCloseIntent}
            className="group flex items-center justify-center gap-3 w-full h-14 rounded-full bg-white text-black font-semibold text-sm tracking-widest uppercase hover:bg-white/95 active:scale-[0.98] transition shadow-[0_0_25px_rgba(255,255,255,0.2)] cursor-pointer"
          >
            <span>CLOSE INTENT</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}

        {/* In CLOSED: "BACK TO HOME" */}
        {intent.currentState === 'CLOSED' && (
          <button
            id="closed-return-home-btn"
            onClick={onCloseView}
            className="flex items-center justify-center gap-2 w-full h-14 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs font-mono tracking-widest uppercase transition cursor-pointer"
          >
            <span>BACK TO HOME</span>
          </button>
        )}
      </div>
    </div>
  );
};
