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
    // Only show on first visit in session, or when forced via prop / URL query
    try {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlIntro = urlParams?.get('intro') === '1' || urlParams?.get('splash') === '1';
      const alreadySeen = sessionStorage.getItem('docstudio_intro_seen');

      if (!alreadySeen || forcePlay || urlIntro) {
        setVisible(true);
        sessionStorage.setItem('docstudio_intro_seen', 'true');

        // Auto-dismiss sequence
        const fadeTimer = setTimeout(() => {
          setFadingOut(true);
        }, 3400);

        const endTimer = setTimeout(() => {
          setVisible(false);
          onComplete?.();
        }, 4100);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(endTimer);
        };
      }
    } catch {
      // ignore storage errors
    }
  }, [forcePlay, onComplete]);

  // Keyboard shortcut to dismiss
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  const handleDismiss = () => {
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 450);
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white text-neutral-950 select-none transition-opacity duration-700 cursor-pointer ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Pristine Gallery Lighting Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6 px-6 max-w-4xl">
        {/* Animated Logo Mark */}
        <div className="relative animate-intro-logo">
          <DocdrilLogo size={72} className="text-neutral-950 drop-shadow-sm" />
        </div>

        {/* Wordmark in Luxury Serif */}
        <div className="animate-intro-wordmark">
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-serif font-normal tracking-[0.01em] text-neutral-950 leading-none">
            DocStudio
          </h1>
        </div>

        {/* Follow-up luxury typography */}
        <div className="animate-intro-tagline pt-2">
          <p className="font-serif italic text-lg sm:text-2xl md:text-3xl text-neutral-600 tracking-wide font-normal">
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
        className="absolute bottom-8 sm:bottom-12 text-xs font-sans font-medium text-neutral-500 hover:text-black transition-colors cursor-pointer py-2 px-4 rounded-full border border-neutral-200/80 bg-white/90 shadow-sm"
      >
        Enter Studio [Esc] →
      </button>
    </div>
  );
}
