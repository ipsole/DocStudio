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
  const dismissedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Unified dismiss handler: initiates fade-out then unmounts
  const triggerDismiss = useCallback((delayFadeMs = 0, fadeDurationMs = 600) => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    if (delayFadeMs <= 0) {
      setFadingOut(true);
    } else {
      setTimeout(() => {
        setFadingOut(true);
      }, delayFadeMs);
    }

    setTimeout(() => {
      setVisible(false);
      onCompleteRef.current?.();
    }, delayFadeMs + fadeDurationMs);
  }, []);

  // Immediate dismiss on click or keypress
  const handleImmediateDismiss = useCallback(() => {
    triggerDismiss(0, 450);
  }, [triggerDismiss]);

  // Step 1: Check if splash should activate on mount
  useEffect(() => {
    try {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlIntro = urlParams?.get('intro') === '1' || urlParams?.get('splash') === '1';
      const alreadySeen = sessionStorage.getItem('docstudio_intro_seen');

      if (!alreadySeen || forcePlay || urlIntro) {
        dismissedRef.current = false;
        setFadingOut(false);
        setVisible(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [forcePlay]);

  // Step 2: Auto-transition timers once visible
  useEffect(() => {
    if (!visible) return;

    try {
      sessionStorage.setItem('docstudio_intro_seen', 'true');
    } catch {
      // ignore
    }

    // Fallback auto-dismiss timer in case CSS onAnimationEnd is missed:
    // Logo (0s) -> Wordmark (0.35s) -> Tagline (1.25s to 2.45s).
    // At 2.7s, start smooth fade-out; by 3.3s unmount and show main screen.
    const fallbackTimer = setTimeout(() => {
      triggerDismiss(0, 600);
    }, 2750);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [visible, triggerDismiss]);

  // Keyboard shortcut to dismiss early if user taps Escape/Enter/Space
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleImmediateDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleImmediateDismiss]);

  if (!visible) return null;

  return (
    <div
      onClick={handleImmediateDismiss}
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

        {/* Follow-up luxury typography: when finished revealing, auto-triggers dismiss after 250ms hold */}
        <div
          onAnimationEnd={() => triggerDismiss(250, 600)}
          className="animate-intro-tagline pt-2"
        >
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
          handleImmediateDismiss();
        }}
        className="absolute bottom-8 sm:bottom-12 text-xs font-sans font-medium text-neutral-400 hover:text-black transition-colors cursor-pointer py-1.5 px-3.5 rounded-full border border-neutral-200/80 bg-white/90 shadow-sm"
      >
        Skip [Esc] →
      </button>
    </div>
  );
}
