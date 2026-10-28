'use client';

import React, { useState, useEffect } from 'react';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';

interface IntroSplashProps {
  onComplete?: () => void;
  forcePlay?: boolean;
}

export function IntroSplash({ onComplete, forcePlay = false }: IntroSplashProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Only show on first visit in session, or when forced
    try {
      const alreadySeen = sessionStorage.getItem('docstudio_intro_seen');
      if (!alreadySeen || forcePlay) {
        setVisible(true);
        sessionStorage.setItem('docstudio_intro_seen', 'true');

        // Auto-dismiss sequence
        const fadeTimer = setTimeout(() => {
          setFadingOut(true);
        }, 3200);

        const endTimer = setTimeout(() => {
          setVisible(false);
          onComplete?.();
        }, 3900);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(endTimer);
        };
      }
    } catch {
      // ignore storage errors
    }
  }, [forcePlay, onComplete]);

  const handleDismiss = () => {
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white text-neutral-950 dark:bg-black dark:text-white select-none transition-opacity duration-700 cursor-pointer ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center space-y-5 px-6 max-w-4xl">
        {/* Animated Logo Mark */}
        <div className="relative animate-intro-logo">
          <DocdrilLogo size={68} className="text-neutral-950 dark:text-white drop-shadow-sm" />
        </div>

        {/* Wordmark in Luxury Serif */}
        <div className="animate-intro-wordmark">
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-serif font-normal tracking-[0.01em] text-neutral-950 dark:text-white leading-none">
            DocStudio
          </h1>
        </div>

        {/* Follow-up luxury typography */}
        <div className="animate-intro-tagline pt-2">
          <p className="font-serif italic text-base sm:text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 tracking-wide font-normal">
            Designed with purpose.
          </p>
        </div>
      </div>

      {/* Discrete Skip Hint */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute bottom-8 sm:bottom-12 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer py-2 px-4 rounded-full border border-neutral-200/60 dark:border-neutral-800"
      >
        Enter Studio →
      </button>
    </div>
  );
}
