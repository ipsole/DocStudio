'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  STUDIO_PERSONAS,
  GRADIENT_MONOGRAMS,
  ALL_LEGACY_ICONS,
} from '@/lib/avatarData';
export interface UserAvatarProps {
  user?: {
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
    providerData?: Array<{ providerId: string; photoURL?: string | null }>;
  } | null;
  profile?: {
    photoURL?: string | null;
    avatarIcon?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null;
  /** Explicit override for real-time live preview before saving */
  avatarIcon?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  className?: string;
  shape?: 'circle' | 'rounded';
}

const SIZE_MAP = {
  xs: {
    container: 'w-6 h-6 text-[10px]',
    icon: 'w-3 h-3',
    badge: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    dimension: 24,
  },
  sm: {
    container: 'w-9 h-9 text-xs',
    icon: 'w-4 h-4',
    badge: 'w-3 h-3 -bottom-0.5 -right-0.5',
    dimension: 36,
  },
  md: {
    container: 'w-11 h-11 text-sm',
    icon: 'w-5 h-5',
    badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
    dimension: 44,
  },
  lg: {
    container: 'w-14 h-14 text-base',
    icon: 'w-6 h-6',
    badge: 'w-4 h-4 -bottom-1 -right-1',
    dimension: 56,
  },
  xl: {
    container: 'w-16 h-16 text-lg',
    icon: 'w-7 h-7',
    badge: 'w-4.5 h-4.5 -bottom-1 -right-1',
    dimension: 64,
  },
  '2xl': {
    container: 'w-20 h-20 text-2xl',
    icon: 'w-9 h-9',
    badge: 'w-5 h-5 -bottom-1 -right-1',
    dimension: 80,
  },
  hero: {
    container: 'w-24 h-24 text-3xl',
    icon: 'w-10 h-10',
    badge: 'w-6 h-6 -bottom-1.5 -right-1.5',
    dimension: 96,
  },
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().charAt(0).toUpperCase();
  }
  return 'U';
}

export function UserAvatar({
  user,
  profile,
  avatarIcon,
  size = 'md',
  className = '',
  shape = 'circle',
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Active avatar identifier: explicit prop takes precedence, then profile, default null
  const activeAvatar = avatarIcon !== undefined ? avatarIcon : profile?.avatarIcon;

  // Detect Google Photo URL
  const googlePhoto =
    user?.photoURL ||
    profile?.photoURL ||
    user?.providerData?.find((p) => p.providerId === 'google.com')?.photoURL ||
    null;

  // Name & Initials
  const displayName = profile?.displayName || user?.displayName || null;
  const email = profile?.email || user?.email || null;
  const initials = getInitials(displayName, email);

  // Dimensions
  const conf = SIZE_MAP[size] || SIZE_MAP.md;
  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  // Determine if Google photo should be active
  // Rule: If explicitly selected as 'google'
  // OR if no custom avatar is set (or was legacy 'User') and a valid Google photo exists
  const isGoogleActive =
    !imgError &&
    Boolean(googlePhoto) &&
    (activeAvatar === 'google' || (!activeAvatar && Boolean(googlePhoto)) || (activeAvatar === 'User' && Boolean(googlePhoto)));

  // 1. Render Google Photo
  if (isGoogleActive && googlePhoto) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${conf.container} ${radiusClass} ${className}`}
      >
        <div
          className={`w-full h-full overflow-hidden ${radiusClass} border border-neutral-200/90 dark:border-neutral-800 shadow-sm bg-neutral-100 dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/10`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={googlePhoto}
            alt={displayName || 'User Profile Photo'}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  // 2. Render Studio Persona
  if (activeAvatar && activeAvatar.startsWith('persona-')) {
    const persona = STUDIO_PERSONAS.find((p) => p.id === activeAvatar);
    if (persona) {
      const IconComponent = persona.icon;
      return (
        <div
          className={`relative inline-flex items-center justify-center shrink-0 select-none ${conf.container} ${radiusClass} ${className}`}
        >
          <div
            className={`w-full h-full overflow-hidden ${radiusClass} flex items-center justify-center text-white shadow-sm ring-1 ring-black/10 dark:ring-white/15`}
            style={{ background: persona.gradientCss }}
          >
            <IconComponent className={`${conf.icon} text-white drop-shadow-sm`} />
          </div>
        </div>
      );
    }
  }

  // 3. Render Gradient Monogram
  if (activeAvatar && activeAvatar.startsWith('grad-')) {
    const grad = GRADIENT_MONOGRAMS.find((g) => g.id === activeAvatar);
    if (grad) {
      return (
        <div
          className={`relative inline-flex items-center justify-center shrink-0 select-none ${conf.container} ${radiusClass} ${className}`}
        >
          <div
            className={`w-full h-full overflow-hidden ${radiusClass} border ${grad.border} flex items-center justify-center text-white font-serif font-semibold tracking-wider shadow-sm ring-1 ring-black/10 dark:ring-white/15`}
            style={{ background: grad.gradientCss }}
          >
            <span className="drop-shadow-sm">{initials}</span>
          </div>
        </div>
      );
    }
  }

  // 4. Render Curated or Legacy Symbol Emblem
  if (activeAvatar && ALL_LEGACY_ICONS[activeAvatar]) {
    const IconComponent = ALL_LEGACY_ICONS[activeAvatar];
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${conf.container} ${radiusClass} ${className}`}
      >
        <div
          className={`w-full h-full overflow-hidden ${radiusClass} bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center shadow-sm border border-neutral-300 dark:border-neutral-700`}
        >
          <IconComponent className={conf.icon} />
        </div>
      </div>
    );
  }

  // 5. Default Initials Monogram
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${conf.container} ${radiusClass} ${className}`}
    >
      <div
        className={`w-full h-full overflow-hidden ${radiusClass} bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-sans font-semibold flex items-center justify-center border border-neutral-300 dark:border-neutral-700 shadow-sm`}
      >
        <span>{initials}</span>
      </div>
    </div>
  );
}
