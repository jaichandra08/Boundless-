import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { OrbitalGlyph } from './OrbitalGlyph';
import { getCanonicalIntention } from '../utils/text';

interface CreateViewProps {
  onBack: () => void;
  onSubmit: (intentText: string) => void;
}

export const CreateView: React.FC<CreateViewProps> = ({ onBack, onSubmit }) => {
  const [text, setText] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    // Instant autofocus when landing from START
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submittedRef.current) return;

    const canonical = getCanonicalIntention(text);
    if (!canonical) return;

    submittedRef.current = true;
    setIsTransforming(true);

    // In-place physical crystallization into the living intention object
    setTimeout(() => {
      onSubmit(canonical);
    }, 420);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isValid = getCanonicalIntention(text).length > 0;

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between px-6 py-8 sm:py-12 max-w-lg mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full min-h-[40px]">
        <button
          id="create-back-btn"
          type="button"
          onClick={onBack}
          disabled={isTransforming}
          className={`flex items-center gap-2 text-xs font-mono tracking-widest text-white/40 hover:text-white transition p-2 -ml-2 rounded-lg ${
            isTransforming ? 'opacity-0 pointer-events-none' : ''
          }`}
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>
      </div>

      {/* Main Transformation Area */}
      <div className="flex-1 flex flex-col justify-center my-6">
        <AnimatePresence mode="wait">
          {!isTransforming ? (
            <motion.form
              key="form-input"
              onSubmit={handleSubmit}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col"
            >
              <label
                htmlFor="intent-input"
                className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white leading-tight block mb-8"
              >
                What do you want to happen?
              </label>

              <div className="relative w-full">
                <textarea
                  ref={textareaRef}
                  id="intent-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write it exactly how you think it."
                  rows={4}
                  className="w-full bg-transparent hover:bg-white/[0.02] focus:bg-white/[0.04] border-0 border-b border-white/20 focus:border-white/60 p-2 text-xl sm:text-2xl text-white placeholder-white/25 outline-none transition-all duration-150 resize-none leading-relaxed font-light"
                />
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="transforming-intent"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center select-none"
            >
              {/* Orbital Glyph coalescing into INTENDED */}
              <div className="mb-8">
                <OrbitalGlyph state="INTENDED" size="lg" />
              </div>

              <div className="text-[11px] font-mono tracking-[0.3em] text-white/40 uppercase mb-4">
                INTENDED
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white leading-tight max-w-md break-words">
                {getCanonicalIntention(text)}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Primary Action */}
      <div className="w-full pb-safe">
        <button
          id="create-submit-btn"
          type="button"
          onClick={() => handleSubmit()}
          disabled={!isValid || isTransforming}
          className={`group flex items-center justify-center gap-3 w-full h-14 rounded-full font-semibold text-sm tracking-widest uppercase transition-all duration-200 ${
            isTransforming
              ? 'bg-white text-black opacity-90 scale-[0.98]'
              : isValid
              ? 'bg-white text-black hover:bg-white/95 active:scale-[0.98] shadow-[0_0_25px_rgba(255,255,255,0.18)] cursor-pointer'
              : 'bg-white/10 text-white/30 border border-white/5 cursor-not-allowed'
          }`}
        >
          <span>{isTransforming ? 'CRYSTALLIZING…' : 'MAKE IT REAL'}</span>
          <ArrowRight className={`w-4 h-4 transition-transform ${isValid && !isTransforming ? 'group-hover:translate-x-1' : ''}`} />
        </button>
      </div>
    </div>
  );
};
