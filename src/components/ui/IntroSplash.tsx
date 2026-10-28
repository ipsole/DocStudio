'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';

interface IntroSplashProps {
  onComplete?: () => void;
  forcePlay?: boolean;
}

export function IntroSplash({ onComplete, forcePlay = false }: IntroSplashProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleDismiss = useCallback(() => {
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onCompleteRef.current?.();
    }, 500);
  }, []);

  useEffect(() => {
    // Only show on first visit in session, or when forced via prop / URL query
    try {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlIntro = urlParams?.get('intro') === '1' || urlParams?.get('splash') === '1';
      const alreadySeen = sessionStorage.getItem('docstudio_intro_seen');

      if (!alreadySeen || forcePlay || urlIntro) {
        setVisible(true);
        setFadingOut(false);
        sessionStorage.setItem('docstudio_intro_seen', 'true');

        // Automatic transition to main screen without waiting for user action:
        // Keyframe timeline: Tagline finishes at ~2.45s. Hold gently, start fadeout at 2.8s
        const fadeTimer = setTimeout(() => {
          setFadingOut(true);
        }, 2800);

        // Fully unmount and reveal main screen by 3.4s
        const endTimer = setTimeout(() => {
          setVisible(false);
          onCompleteRef.current?.();
        }, 3400);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(endTimer);
        };
      }
    } catch {
      // ignore storage errors
    }
  }, [forcePlay]);

  // Keyboard shortcut to dismiss early if user doesn't want to wait
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleDismiss]);

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white text-neutral-950 select-none transition-all duration-600 ease-out cursor-pointer ${
        fadingOut ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
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
        className="absolute bottom-8 sm:bottom-12 text-xs font-sans font-medium text-neutral-400 hover:text-black transition-colors cursor-pointer py-1.5 px-3.5 rounded-full border border-neutral-200/80 bg-white/90 shadow-sm"
      >
        Skip [Esc] →
      </button>
    </div>
  );
}
