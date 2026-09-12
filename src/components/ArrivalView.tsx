import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface ArrivalViewProps {
  onStart: () => void;
  onViewHome?: () => void;
  hasExistingIntents?: boolean;
}

export const ArrivalView: React.FC<ArrivalViewProps> = ({
  onStart,
  onViewHome,
  hasExistingIntents = false,
}) => {
  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between px-6 py-10 sm:py-16 max-w-lg mx-auto select-none">
      {/* Top Bar */}
      <div className="flex justify-end items-center w-full min-h-[36px]">
        {hasExistingIntents && onViewHome && (
          <button
            id="arrival-home-btn"
            onClick={onViewHome}
            className="text-xs font-mono tracking-widest text-white/50 hover:text-white transition px-3.5 py-1.5 rounded-full border border-white/10 hover:border-white/25 cursor-pointer"
          >
            INTENTIONS &rarr;
          </button>
        )}
      </div>

      {/* Main Focal Area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center my-auto py-12"
      >
        {/* Kinetic Geometric Glyph: Intention Orbital */}
        <div className="relative mb-12 flex items-center justify-center w-32 h-32">
          <div className="absolute inset-0 rounded-full border border-white/15 animate-breathe" />
          <div className="absolute inset-4 rounded-full border border-dashed border-white/20" />
          <div className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.95)]" />
          {/* Orbital node with subtle gravitational presence */}
          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-sky-400/90 shadow-[0_0_12px_rgba(56,189,248,0.7)]" />
        </div>

        {/* Logo */}
        <h1
          id="arrival-title"
          className="text-4xl sm:text-5xl font-extrabold tracking-[0.26em] text-white uppercase"
        >
          BOUNDLESS
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-white/60 font-light tracking-wide max-w-xs sm:max-w-sm">
          Turn intention into reality.
        </p>
      </motion.div>

      {/* Bottom Action Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center w-full gap-4 pb-safe"
      >
        <button
          id="arrival-start-btn"
          onClick={onStart}
          className="group relative flex items-center justify-center gap-3 w-full max-w-sm h-14 rounded-full bg-white text-black font-semibold text-sm tracking-widest uppercase hover:bg-white/95 active:scale-[0.98] transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.15)] cursor-pointer"
        >
          <span>START</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>

        <span className="text-xs font-mono tracking-widest text-white/40 uppercase">
          No account required.
        </span>
      </motion.div>
    </div>
  );
};
