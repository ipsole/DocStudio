'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface WordItem {
  word: string;
  className?: string;
  pauseAfterMs?: number;
}

const MANIFESTO_WORDS: WordItem[] = [
  { word: 'Welcome', className: 'text-neutral-500 dark:text-neutral-400 font-light' },
  { word: 'to', className: 'text-neutral-500 dark:text-neutral-400 font-light' },
  { word: 'DocStudio', className: 'text-neutral-950 dark:text-white font-medium tracking-tight', pauseAfterMs: 240 },
  { word: '—', className: 'text-neutral-400 dark:text-neutral-600 font-light', pauseAfterMs: 180 },
  { word: 'a', className: 'text-neutral-600 dark:text-neutral-300 font-light' },
  { word: 'space', className: 'text-neutral-600 dark:text-neutral-300 font-light' },
  {
    word: 'designed',
    className:
      'italic text-neutral-950 dark:text-white font-normal underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-8 decoration-1',
  },
  {
    word: 'with',
    className:
      'italic text-neutral-950 dark:text-white font-normal underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-8 decoration-1',
  },
  {
    word: 'purpose',
    className:
      'italic text-neutral-950 dark:text-white font-normal underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-8 decoration-1',
    pauseAfterMs: 280,
  },
  { word: 'to', className: 'text-neutral-600 dark:text-neutral-300 font-light' },
  { word: 'serve', className: 'text-neutral-600 dark:text-neutral-300 font-light' },
  { word: 'founders,', className: 'text-neutral-900 dark:text-neutral-100 font-medium', pauseAfterMs: 140 },
  { word: 'creators,', className: 'text-neutral-900 dark:text-neutral-100 font-medium', pauseAfterMs: 140 },
  { word: 'and', className: 'text-neutral-500 dark:text-neutral-400 font-light' },
  { word: 'business', className: 'text-neutral-950 dark:text-white font-medium' },
  { word: 'owners.', className: 'text-neutral-950 dark:text-white font-medium', pauseAfterMs: 500 },
];

interface LoginWelcomeWriterProps {
  forcePlay?: boolean;
  onComplete?: () => void;
  holdDurationMs?: number;
}

export function LoginWelcomeWriter({
  forcePlay = false,
  onComplete,
  holdDurationMs = 1500,
}: LoginWelcomeWriterProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [revealedWordCount, setRevealedWordCount] = useState(0);

  // Check if we should activate on mount
  useEffect(() => {
    try {
      const pendingFlag = sessionStorage.getItem('docstudio_login_welcome');
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlWelcome = urlParams?.get('welcome') === 'true' || urlParams?.get('welcome') === '1';

      if (pendingFlag === 'pending' || urlWelcome || forcePlay) {
        setVisible(true);
        setRevealedWordCount(0);
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
    }, 500);
  }, [onComplete]);

  // Keyboard shortcut: Escape or Enter or Space skips
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

  // Smooth word-by-word streaming animation
  useEffect(() => {
    if (!visible) return;

    if (revealedWordCount >= MANIFESTO_WORDS.length) {
      // All words revealed: hold gently, then smoothly dissolve and take user to page
      const finishTimer = setTimeout(() => {
        handleDismiss();
      }, holdDurationMs);
      return () => clearTimeout(finishTimer);
    }

    const currentWord = MANIFESTO_WORDS[revealedWordCount];
    const baseInterval = 115; // smooth interval between words
    const delay = baseInterval + (currentWord.pauseAfterMs || 0);

    const timer = setTimeout(() => {
      setRevealedWordCount((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [visible, revealedWordCount, holdDurationMs, handleDismiss]);

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[120] flex flex-col items-center justify-center bg-white/98 dark:bg-black/98 backdrop-blur-2xl text-neutral-950 dark:text-white select-none transition-opacity duration-700 cursor-pointer ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Pristine Ambient Radial Studio Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.03)_0%,transparent_75%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_75%)] pointer-events-none" />

      {/* Discrete Top-Right Skip */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute top-6 right-6 sm:top-8 sm:right-10 text-xs font-sans font-medium text-neutral-500 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer py-1.5 px-3.5 rounded-full border border-neutral-200/70 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 shadow-sm"
      >
        Skip [Esc] →
      </button>

      {/* Pure, Simple Luxury Word-by-Word Text in Center */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 max-w-4xl px-6 sm:px-12 text-center cursor-default select-none"
      >
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[3.6rem] font-serif font-normal tracking-[0.01em] leading-relaxed sm:leading-relaxed md:leading-[1.3] text-neutral-950 dark:text-white">
          {MANIFESTO_WORDS.map((item, idx) => {
            const isRevealed = idx < revealedWordCount;
            return (
              <span
                key={idx}
                className={`inline-block mr-[0.3em] transition-all duration-500 ease-out ${
                  item.className || ''
                } ${
                  isRevealed
                    ? 'opacity-100 translate-y-0 filter-none'
                    : 'opacity-0 translate-y-3 blur-[4px]'
                }`}
              >
                {item.word}
              </span>
            );
          })}
        </h1>
      </div>
    </div>
  );
}
