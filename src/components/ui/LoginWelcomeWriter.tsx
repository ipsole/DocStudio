'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { ArrowRight, Sparkles } from 'lucide-react';

interface TextSegment {
  text: string;
  className: string;
  pauseAfter?: number;
}

const MANIFESTO_SEGMENTS: TextSegment[] = [
  {
    text: 'Welcome to ',
    className: 'text-neutral-500 dark:text-neutral-400 font-light',
  },
  {
    text: 'DocStudio',
    className: 'text-neutral-950 dark:text-white font-medium tracking-tight',
    pauseAfter: 200,
  },
  {
    text: ' — ',
    className: 'text-neutral-400 dark:text-neutral-600 font-light',
    pauseAfter: 180,
  },
  {
    text: 'a space ',
    className: 'text-neutral-700 dark:text-neutral-300 font-light',
  },
  {
    text: 'designed with purpose',
    className: 'text-neutral-950 dark:text-white italic font-normal underline decoration-neutral-300 dark:decoration-neutral-700 decoration-1 underline-offset-8',
    pauseAfter: 260,
  },
  {
    text: ' to serve ',
    className: 'text-neutral-700 dark:text-neutral-300 font-light',
  },
  {
    text: 'founders',
    className: 'text-neutral-950 dark:text-neutral-100 font-medium',
    pauseAfter: 100,
  },
  {
    text: ', ',
    className: 'text-neutral-400 dark:text-neutral-600',
    pauseAfter: 140,
  },
  {
    text: 'creators',
    className: 'text-neutral-950 dark:text-neutral-100 font-medium',
    pauseAfter: 100,
  },
  {
    text: ', and ',
    className: 'text-neutral-500 dark:text-neutral-400',
    pauseAfter: 100,
  },
  {
    text: 'business owners.',
    className: 'text-neutral-950 dark:text-white font-medium',
    pauseAfter: 450,
  },
];

interface LoginWelcomeWriterProps {
  forcePlay?: boolean;
  onComplete?: () => void;
  autoDismissDelay?: number;
}

export function LoginWelcomeWriter({
  forcePlay = false,
  onComplete,
  autoDismissDelay = 3400,
}: LoginWelcomeWriterProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const totalCharacters = MANIFESTO_SEGMENTS.reduce((sum, seg) => sum + seg.text.length, 0);

  // Check if we should activate on mount
  useEffect(() => {
    try {
      const pendingFlag = sessionStorage.getItem('docstudio_login_welcome');
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlWelcome = urlParams?.get('welcome') === 'true' || urlParams?.get('welcome') === '1';

      if (pendingFlag === 'pending' || urlWelcome || forcePlay) {
        setVisible(true);
        setCharCount(0);
        setIsFinished(false);
        setFadingOut(false);
        sessionStorage.removeItem('docstudio_login_welcome');
      }
    } catch {
      // ignore
    }
  }, [forcePlay]);

  const handleDismiss = useCallback(() => {
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 450);
  }, [onComplete]);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCharCount(0);
    setIsFinished(false);
  };

  // Keyboard shortcut: Escape or Enter skips
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleDismiss]);

  // Character-by-character typewriter effect with natural human pacing
  useEffect(() => {
    if (!visible || isFinished) return;

    if (charCount >= totalCharacters) {
      setIsFinished(true);
      // Auto dismiss timer after writing finishes
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }

    // Determine current character and calculate micro-pause
    let accumulated = 0;
    let currentSegment: TextSegment | null = null;
    let charInSegment = 0;

    for (const seg of MANIFESTO_SEGMENTS) {
      if (charCount < accumulated + seg.text.length) {
        currentSegment = seg;
        charInSegment = charCount - accumulated;
        break;
      }
      accumulated += seg.text.length;
    }

    const currentChar = currentSegment ? currentSegment.text[charInSegment] : '';
    let delay = 32; // base character typing speed in ms

    // Natural punctuation rhythm
    if (currentChar === ',') delay = 160;
    else if (currentChar === '.') delay = 280;
    else if (currentChar === '—') delay = 220;
    else if (currentChar === ' ') delay = 24;

    // Check if end of segment pause applies
    if (currentSegment && charInSegment === currentSegment.text.length - 1 && currentSegment.pauseAfter) {
      delay += currentSegment.pauseAfter;
    }

    const stepTimer = setTimeout(() => {
      setCharCount((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(stepTimer);
  }, [visible, charCount, totalCharacters, isFinished, autoDismissDelay, handleDismiss]);

  if (!visible) return null;

  // Render text segments up to charCount
  let charsRemaining = charCount;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[120] flex flex-col items-center justify-center bg-white/95 dark:bg-black/95 backdrop-blur-2xl text-neutral-950 dark:text-white select-none transition-opacity duration-500 cursor-pointer ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Soft Ambient Radial Background Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.04)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex flex-col items-center text-center px-6 sm:px-12 max-w-4xl cursor-default"
      >
        {/* Floating Brand Insignia */}
        <div className="relative mb-6 sm:mb-8 animate-logo-reveal animate-subtle-float">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-950 text-white dark:bg-white dark:text-black flex items-center justify-center shadow-2xl animate-logo-aura">
            <DocdrilLogo size={42} className="text-white dark:text-black" />
          </div>
        </div>

        {/* Studio Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-[0.2em] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 mb-8 sm:mb-10 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
          <span>Unified Identity Verified</span>
        </div>

        {/* Real-time Writing Typography */}
        <div className="min-h-[140px] sm:min-h-[160px] flex items-center justify-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.85rem] font-serif font-normal tracking-[0.01em] leading-relaxed sm:leading-relaxed text-neutral-950 dark:text-white select-none">
            {MANIFESTO_SEGMENTS.map((seg, idx) => {
              if (charsRemaining <= 0) return null;
              const visibleLen = Math.min(charsRemaining, seg.text.length);
              charsRemaining -= visibleLen;
              const slice = seg.text.slice(0, visibleLen);

              return (
                <span key={idx} className={seg.className}>
                  {slice}
                </span>
              );
            })}

            {/* Elegant Blinking Typographic Cursor */}
            <span
              className={`inline-block w-[2.5px] h-[0.9em] bg-neutral-900 dark:bg-white ml-1 align-baseline transition-opacity duration-150 ${
                isFinished ? 'animate-pulse opacity-60' : 'opacity-100'
              }`}
            />
          </h1>
        </div>

        {/* Post-Writing Action Controls */}
        <div
          className={`flex items-center gap-3 mt-10 sm:mt-12 transition-all duration-700 ${
            isFinished
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-xs sm:text-sm font-semibold transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <span>Enter Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <span>Replay ↺</span>
          </button>
        </div>
      </div>

      {/* Discrete Bottom Dismiss Hint */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute bottom-6 sm:bottom-10 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer py-1.5 px-3.5 rounded-full border border-neutral-200/60 dark:border-neutral-800/80"
      >
        Skip [Esc] →
      </button>
    </div>
  );
}
