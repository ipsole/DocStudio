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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-neutral-900 dark:text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="space-y-0.5">
            <h3 className="text-lg font-bold font-sans tracking-tight">
              Change Profile Avatar
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Select your identity avatar across the DocStudio creative suite.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview */}
        <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 shrink-0">
          <UserAvatar
            user={user}
            profile={profile}
            avatarIcon={selectedIcon}
            size="lg"
          />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-neutral-950 dark:text-white font-sans">
              Live Preview
            </span>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
              This avatar will represent you in the navigation bar and comments.
            </p>
          </div>
        </div>

        {/* Scrollable Picker Body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          <AvatarIconPicker
            selectedIcon={selectedIcon}
            onSelectIcon={(id) => setSelectedIcon(id)}
            user={user}
            profile={profile}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black transition-all shadow-md cursor-pointer disabled:opacity-60"
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
