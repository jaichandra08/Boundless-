import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 active:bg-white/25 px-3 py-1.5 text-xs font-medium text-white transition tracking-wide backdrop-blur-md"
        title="Install BOUNDLESS app"
      >
        <Download className="w-3.5 h-3.5 text-white/80" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition tracking-wide backdrop-blur-md"
          title="Install BOUNDLESS on iOS"
        >
          <Share className="w-3.5 h-3.5 text-white/80" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div
            id="ios-guide-backdrop"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              id="ios-guide-modal"
              className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#121318] p-6 shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-semibold tracking-wider uppercase text-white">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-white/50 hover:text-white rounded-lg transition"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-4 text-xs text-white/70 leading-relaxed">
                Add BOUNDLESS to your home screen for the full immersive app experience:
              </p>
              <ol className="mt-3 space-y-2.5 text-xs text-white/85">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">1</span>
                  <span>Tap the <strong className="text-white">Share</strong> icon in Safari toolbar.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">2</span>
                  <span>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</span>
                </li>
              </ol>
              <button
                id="close-ios-guide-btn"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-white text-black py-2.5 text-xs font-semibold tracking-wide hover:bg-white/90 active:scale-[0.99] transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
