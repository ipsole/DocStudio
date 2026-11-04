'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { DocApp } from '@/types';
import { REAL_APPS } from '@/lib/seedData';

interface AppPreviewContextType {
  isOpen: boolean;
  currentApp: DocApp | null;
  appsList: DocApp[];
  currentIndex: number;
  openPreview: (app: DocApp, customList?: DocApp[]) => void;
  closePreview: () => void;
  nextApp: () => void;
  prevApp: () => void;
  setIndex: (index: number) => void;
}

const AppPreviewContext = createContext<AppPreviewContextType | undefined>(undefined);

export function AppPreviewProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [appsList, setAppsList] = useState<DocApp[]>(REAL_APPS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const appsListRef = useRef<DocApp[]>(REAL_APPS);

  // Keep ref synchronized with state
  useEffect(() => {
    appsListRef.current = appsList;
  }, [appsList]);

  const openPreview = useCallback((app: DocApp, customList?: DocApp[]) => {
    const list = customList && customList.length > 0 ? customList : REAL_APPS;
    appsListRef.current = list;
    setAppsList(list);
    const foundIndex = list.findIndex((a) => a.id === app.id || a.slug === app.slug);
    setCurrentIndex(foundIndex >= 0 ? foundIndex : 0);
    setIsOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextApp = useCallback(() => {
    const list = appsListRef.current;
    if (!list || list.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % list.length);
  }, []);

  const prevApp = useCallback(() => {
    const list = appsListRef.current;
    if (!list || list.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  }, []);

  const setIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePreview();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextApp();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevApp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextApp, prevApp, closePreview]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const currentApp = appsList[currentIndex] || null;

  return (
    <AppPreviewContext.Provider
      value={{
        isOpen,
        currentApp,
        appsList,
        currentIndex,
        openPreview,
        closePreview,
        nextApp,
        prevApp,
        setIndex,
      }}
    >
      {children}
    </AppPreviewContext.Provider>
  );
}

export function useAppPreview() {
  const context = useContext(AppPreviewContext);
  return context;
}
