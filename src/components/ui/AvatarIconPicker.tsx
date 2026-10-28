'use client';

import React, { useState } from 'react';
import {
  STUDIO_PERSONAS,
  GRADIENT_MONOGRAMS,
  CURATED_EMBLEMS,
  ALL_LEGACY_ICONS,
  StudioPersona,
  GradientMonogram,
  CuratedEmblem,
} from '@/lib/avatarData';
import { GoogleGLogo } from '@/components/ui/GoogleGLogo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  Sparkles,
  Check,
  Layers,
  Crown,
  Palette,
  Search,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '@/types';

export { ALL_LEGACY_ICONS as AVATAR_ICONS };

export function renderUserIcon(iconId?: string | null, className = 'w-4 h-4 text-white') {
  if (!iconId) return null;
  if (iconId.startsWith('persona-')) {
    const match = STUDIO_PERSONAS.find((p) => p.id === iconId);
    if (match) {
      const IconComp = match.icon;
      return <IconComp className={className} />;
    }
  }
  const IconComp = ALL_LEGACY_ICONS[iconId];
  if (!IconComp) return null;
  return <IconComp className={className} />;
}

interface AvatarIconPickerProps {
  selectedIcon: string | null;
  onSelectIcon: (iconId: string) => void;
  user?: User | null;
  profile?: UserProfile | null;
}

type TabType = 'personas' | 'gradients' | 'emblems';

export function AvatarIconPicker({
  selectedIcon,
  onSelectIcon,
  user,
  profile,
}: AvatarIconPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('personas');
  const [emblemSearch, setEmblemSearch] = useState('');

  // Detect Google Photo URL
  const googlePhoto =
    user?.photoURL ||
    profile?.photoURL ||
    user?.providerData?.find((p) => p.providerId === 'google.com')?.photoURL ||
    null;

  const isGoogleSelected =
    selectedIcon === 'google' ||
    (!selectedIcon && Boolean(googlePhoto)) ||
    (selectedIcon === 'User' && Boolean(googlePhoto));

  const filteredEmblems = CURATED_EMBLEMS.filter((e) =>
    e.label.toLowerCase().includes(emblemSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Google Account Photo Integration Card */}
      {googlePhoto ? (
        <div
          onClick={() => onSelectIcon('google')}
          className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none ${
            isGoogleSelected
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-950 dark:border-white shadow-lg ring-1 ring-neutral-950/10 dark:ring-white/20'
              : 'bg-white dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white hover:border-neutral-400 dark:hover:border-neutral-600 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="relative shrink-0">
              <UserAvatar
                user={user}
                profile={profile}
                avatarIcon="google"
                size="md"
                showGoogleBadge={true}
              />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-sans">
                  Google Account Photo
                </span>
                <span
                  className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isGoogleSelected
                      ? 'bg-emerald-500/20 text-emerald-400 dark:bg-emerald-100 dark:text-emerald-800'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <GoogleGLogo className="w-2.5 h-2.5" />
                  <span>Google Synced</span>
                </span>
              </div>
              <p
                className={`text-xs font-sans truncate max-w-xs sm:max-w-md ${
                  isGoogleSelected
                    ? 'text-neutral-300 dark:text-neutral-600'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {user?.email || 'Verified Single Sign-On Avatar'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end">
            {isGoogleSelected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-emerald-500 text-white dark:bg-emerald-600 shadow-sm">
                <Check className="w-3.5 h-3.5" />
                <span>Active Avatar</span>
              </span>
            ) : (
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Use Google Photo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800/80 text-xs font-sans text-neutral-600 dark:text-neutral-400">
          <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shrink-0">
            <GoogleGLogo className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-neutral-900 dark:text-white">
              Google Profile Sync:
            </span>{' '}
            Sign in with Google anytime to automatically sync your verified Google profile picture, or select from the curated creator personas and gradients below.
          </div>
        </div>
      )}

      {/* 2. Style Categories Switcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            {[
              { id: 'personas', label: 'Studio Personas', icon: Crown, count: 8 },
              { id: 'gradients', label: 'Gradient Monograms', icon: Layers, count: 6 },
              { id: 'emblems', label: 'Curated Emblems', icon: Sparkles, count: 16 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-neutral-800 text-neutral-300 dark:bg-neutral-200 dark:text-neutral-800'
                        : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Studio Personas */}
        {activeTab === 'personas' && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Handcrafted creator personas tailored for creative leads, designers, and animators.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {STUDIO_PERSONAS.map((persona) => {
                const isSelected = selectedIcon === persona.id;
                const IconComponent = persona.icon;
                return (
                  <div
                    key={persona.id}
                    onClick={() => onSelectIcon(persona.id)}
                    className={`group relative flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-neutral-50 dark:bg-neutral-900/90 border-neutral-950 dark:border-white shadow-md ring-1 ring-neutral-950 dark:ring-white'
                        : 'bg-white dark:bg-neutral-950/70 border-neutral-200 dark:border-neutral-800/90 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-sm'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${persona.gradient} flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105`}
                    >
                      <IconComponent className="w-5 h-5 drop-shadow-sm" />
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-neutral-950 dark:text-white truncate font-sans">
                          {persona.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-950 dark:text-white shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-sans">
                        {persona.role}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Gradient Monograms */}
        {activeTab === 'gradients' && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Display your personal initials over signature luxury textures and gradients.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {GRADIENT_MONOGRAMS.map((grad) => {
                const isSelected = selectedIcon === grad.id;
                return (
                  <div
                    key={grad.id}
                    onClick={() => onSelectIcon(grad.id)}
                    className={`group relative flex flex-col items-center p-3.5 rounded-2xl border transition-all cursor-pointer select-none space-y-2 text-center ${
                      isSelected
                        ? 'bg-neutral-50 dark:bg-neutral-900 border-neutral-950 dark:border-white shadow-md ring-1 ring-neutral-950 dark:ring-white'
                        : 'bg-white dark:bg-neutral-950/70 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}
                  >
                    <div className="relative">
                      <UserAvatar
                        user={user}
                        profile={profile}
                        avatarIcon={grad.id}
                        size="md"
                        shape="rounded"
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-950 text-white dark:bg-white dark:text-black flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 font-sans truncate w-full">
                      {grad.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Curated Emblems */}
        {activeTab === 'emblems' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                Refined creative symbols styled with minimal luxury monochrome aesthetics.
              </p>
              <div className="relative w-44 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                <input
                  type="text"
                  value={emblemSearch}
                  onChange={(e) => setEmblemSearch(e.target.value)}
                  placeholder="Search emblems..."
                  className="w-full pl-7 pr-2.5 py-1 text-xs border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors rounded-lg font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 p-3.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 rounded-2xl">
              {filteredEmblems.map((emblem) => {
                const isSelected = selectedIcon === emblem.id;
                const IconComponent = emblem.icon;
                return (
                  <button
                    key={emblem.id}
                    type="button"
                    onClick={() => onSelectIcon(emblem.id)}
                    title={emblem.label}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-md ring-1 ring-neutral-950 dark:ring-white scale-105'
                        : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800/80 hover:scale-102'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-[10px] font-sans truncate w-full text-center">
                      {emblem.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
