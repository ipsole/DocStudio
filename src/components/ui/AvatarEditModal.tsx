'use client';

import React, { useState, useEffect } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { AvatarIconPicker } from '@/components/ui/AvatarIconPicker';
import { X, Check, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '@/types';

interface AvatarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIcon: string | null;
  user?: User | null;
  profile?: UserProfile | null;
  onSave: (newIcon: string) => Promise<void>;
}

export function AvatarEditModal({
  isOpen,
  onClose,
  currentIcon,
  user,
  profile,
  onSave,
}: AvatarEditModalProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(currentIcon);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const hasGoogle = Boolean(user?.photoURL || profile?.photoURL);
      setSelectedIcon(currentIcon || (hasGoogle ? 'google' : 'User'));
    }
  }, [isOpen, currentIcon, user, profile]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalIcon = selectedIcon || (user?.photoURL ? 'google' : 'User');
      await onSave(finalIcon);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity animate-fadeIn"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg h-[520px] max-h-[calc(100vh-2rem)] bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl text-neutral-900 dark:text-white flex flex-col overflow-hidden animate-modalPop">
        {/* Header with Integrated Live Preview */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-950">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <UserAvatar
                user={user}
                profile={profile}
                avatarIcon={selectedIcon}
                size="md"
                className="ring-2 ring-neutral-200 dark:ring-neutral-800"
              />
              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full bg-emerald-500 text-[8px] font-bold text-white uppercase tracking-wider">
                Live
              </span>
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-sm sm:text-base font-bold font-sans tracking-tight text-neutral-950 dark:text-white truncate">
                Change Profile Avatar
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans truncate">
                Select your persona across the DocStudio suite.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close avatar modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Picker Body */}
        <div className="p-5 sm:p-6 flex-1 min-h-0 overflow-y-auto space-y-4">
          <AvatarIconPicker
            selectedIcon={selectedIcon}
            onSelectIcon={(id) => setSelectedIcon(id)}
            user={user}
            profile={profile}
          />
        </div>

        {/* Fixed Footer Actions - ALWAYS visible at the bottom of the dialog */}
        <div className="px-5 sm:px-6 py-3 border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black transition-all shadow-md cursor-pointer disabled:opacity-60 active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Apply Avatar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
