import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { IntentState } from '../types';

interface OrbitalGlyphProps {
  state?: IntentState | 'LATENT' | 'CREATING';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OrbitalGlyph: React.FC<OrbitalGlyphProps> = ({
  state = 'INTENDED',
  size = 'md',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24 sm:w-28 sm:h-28',
    lg: 'w-28 h-28 sm:w-32 sm:h-32',
  }[size];

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses} ${className} select-none pointer-events-none`}>
      {/* Outer Ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-white/20"
        animate={
          state === 'MOVING'
            ? { rotate: shouldReduceMotion ? 0 : 360, borderColor: 'rgba(56, 189, 248, 0.4)' }
            : state === 'REAL'
            ? { scale: shouldReduceMotion ? 1 : [1, 1.06, 1], borderColor: 'rgba(255, 255, 255, 0.6)' }
            : { rotate: 0, borderColor: 'rgba(255, 255, 255, 0.2)' }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.1 }
            : state === 'MOVING'
            ? { rotate: { repeat: Infinity, duration: 8, ease: 'linear' } }
            : state === 'REAL'
            ? { scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' } }
            : { duration: 0.4 }
        }
      />

      {/* Inner Orbit Line (Dashed) */}
      <motion.div
        className="absolute inset-3 rounded-full border border-dashed border-white/25"
        animate={
          state === 'MOVING'
            ? { rotate: shouldReduceMotion ? 0 : -360, borderColor: 'rgba(56, 189, 248, 0.3)' }
            : { rotate: 0 }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.1 }
            : state === 'MOVING'
            ? { repeat: Infinity, duration: 12, ease: 'linear' }
            : { duration: 0.4 }
        }
      />

      {/* Central Singularity / Core */}
      <motion.div
        className="relative rounded-full"
        animate={
          state === 'REAL'
            ? {
                width: 24,
                height: 24,
                backgroundColor: '#ffffff',
                boxShadow: '0 0 35px 8px rgba(255, 255, 255, 0.9)',
              }
            : state === 'MOVING'
            ? {
                width: 14,
                height: 14,
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 20px 4px rgba(56, 189, 248, 0.8)',
              }
            : state === 'CLOSED'
            ? {
                width: 12,
                height: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                boxShadow: '0 0 10px 1px rgba(255, 255, 255, 0.3)',
              }
            : {
                // INTENDED / LATENT / CREATING
                width: 12,
                height: 12,
                backgroundColor: '#ffffff',
                boxShadow: '0 0 20px 3px rgba(255, 255, 255, 0.9)',
              }
        }
        transition={{ duration: shouldReduceMotion ? 0.1 : 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Orbital Node: revolving in MOVING, anchored in INTENDED/LATENT, merged in REAL */}
      {state !== 'REAL' && state !== 'CLOSED' && (
        <motion.div
          className="absolute inset-0 flex items-start justify-end p-2 pointer-events-none"
          animate={
            state === 'MOVING' && !shouldReduceMotion
              ? { rotate: 360 }
              : { rotate: 0 }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0.1 }
              : state === 'MOVING'
              ? { repeat: Infinity, duration: 4, ease: 'linear' }
              : { duration: 0.4 }
          }
        >
          <div
            className={`w-2 h-2 rounded-full ${
              state === 'MOVING'
                ? 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]'
                : 'bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.7)]'
            }`}
          />
        </motion.div>
      )}

      {/* Subtle Aura for REAL state */}
      {state === 'REAL' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={
            shouldReduceMotion
              ? { opacity: 0.5, scale: 1 }
              : { opacity: [0.3, 0.7, 0.3], scale: [1, 1.25, 1] }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0.2 }
              : { repeat: Infinity, duration: 3, ease: 'easeInOut' }
          }
          className="absolute inset-0 rounded-full bg-white/10 blur-md pointer-events-none"
        />
      )}
    </div>
  );
};
