'use client';

import React, { useState } from 'react';
import {
  STUDIO_PERSONAS,
  GRADIENT_MONOGRAMS,
  CURATED_EMBLEMS,
  ALL_LEGACY_ICONS,
} from '@/lib/avatarData';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  Sparkles,
  Check,
  Layers,
  Crown,
  Search,
  CheckCircle2,
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
    <div className="space-y-5">
      {/* 1. Google Profile Picture Option (Only if user has a Google photo) */}
      {googlePhoto && (
        <div
          onClick={() => onSelectIcon('google')}
          className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
            isGoogleSelected
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-950 dark:border-white shadow-sm ring-1 ring-neutral-950 dark:ring-white'
              : 'bg-white dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white hover:border-neutral-400 dark:hover:border-neutral-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <UserAvatar
              user={user}
              profile={profile}
              avatarIcon="google"
              size="sm"
            />
            <div>
              <p className="text-xs font-bold font-sans">
                Google Profile Picture
              </p>
              <p
                className={`text-[11px] font-sans truncate ${
                  isGoogleSelected
                    ? 'text-neutral-300 dark:text-neutral-600'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            {isGoogleSelected ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 dark:text-emerald-600">
                <Check className="w-3.5 h-3.5" />
                <span>Selected</span>
              </span>
            ) : (
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Use Google Photo
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Style Categories Switcher */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STUDIO_PERSONAS.map((persona) => {
              const isSelected = selectedIcon === persona.id;
              const IconComponent = persona.icon;
              return (
                <div
                  key={persona.id}
                  onClick={() => onSelectIcon(persona.id)}
                  className={`group relative flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-neutral-50 dark:bg-neutral-900/90 border-neutral-950 dark:border-white shadow-sm ring-1 ring-neutral-950 dark:ring-white'
                      : 'bg-white dark:bg-neutral-950/70 border-neutral-200 dark:border-neutral-800/90 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md transition-transform group-hover:scale-105 ring-1 ring-black/10 dark:ring-white/15"
                    style={{ background: persona.gradientCss }}
                  >
                    <IconComponent className="w-5 h-5 text-white drop-shadow-sm" />
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-neutral-950 dark:text-white truncate font-sans">
                        {persona.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-neutral-950 dark:text-white shrink-0" />
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
        )}

        {/* Tab 2: Gradient Monograms */}
        {activeTab === 'gradients' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {GRADIENT_MONOGRAMS.map((grad) => {
              const isSelected = selectedIcon === grad.id;
              return (
                <div
                  key={grad.id}
                  onClick={() => onSelectIcon(grad.id)}
                  className={`group relative flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer select-none space-y-1.5 text-center ${
                    isSelected
                      ? 'bg-neutral-50 dark:bg-neutral-900 border-neutral-950 dark:border-white shadow-sm ring-1 ring-neutral-950 dark:ring-white'
                      : 'bg-white dark:bg-neutral-950/70 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                >
                  <div className="relative">
                    <UserAvatar
                      user={user}
                      profile={profile}
                      avatarIcon={grad.id}
                      size="sm"
                      shape="rounded"
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-neutral-950 text-white dark:bg-white dark:text-black flex items-center justify-center shadow">
                        <Check className="w-2 h-2" />
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
        )}

        {/* Tab 3: Curated Emblems */}
        {activeTab === 'emblems' && (
          <div className="space-y-2.5">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
              <input
                type="text"
                value={emblemSearch}
                onChange={(e) => setEmblemSearch(e.target.value)}
                placeholder="Search emblems..."
                className="w-full pl-7 pr-2.5 py-1 text-xs border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors rounded-lg font-sans"
              />
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 rounded-xl">
              {filteredEmblems.map((emblem) => {
                const isSelected = selectedIcon === emblem.id;
                const IconComponent = emblem.icon;
                return (
                  <button
                    key={emblem.id}
                    type="button"
                    onClick={() => onSelectIcon(emblem.id)}
                    title={emblem.label}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-md ring-1 ring-neutral-950 dark:ring-white scale-105'
                        : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-800 shadow-sm'
                    }`}
                  >
                    <IconComponent
                      className={`w-5 h-5 ${
                        isSelected
                          ? 'text-white dark:text-neutral-950'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    />
                    <span className="text-[10px] font-sans font-medium truncate w-full text-center">
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
