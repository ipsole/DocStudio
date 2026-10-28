'use client';

import React, { useState } from 'react';
import {
  User,
  Sparkles,
  Zap,
  Flame,
  Rocket,
  Crown,
  Star,
  Shield,
  Heart,
  Smile,
  Code,
  Terminal,
  Cpu,
  Layers,
  Boxes,
  Palette,
  Brush,
  Compass,
  Feather,
  PenTool,
  Eye,
  Camera,
  Video,
  Music,
  Headphones,
  Mic,
  Radio,
  Tv,
  Monitor,
  Smartphone,
  Globe,
  MapPin,
  Flag,
  Anchor,
  Sun,
  Moon,
  Cloud,
  Wind,
  Coffee,
  Briefcase,
  Target,
  TrendingUp,
  Award,
  Gem,
  Key,
  Lock,
  Command,
  Atom,
  Lightbulb,
  Infinity as InfinityIcon,
  Search,
} from 'lucide-react';

export const AVATAR_ICONS = [
  { id: 'User', icon: User, label: 'User' },
  { id: 'Sparkles', icon: Sparkles, label: 'Sparkles' },
  { id: 'Zap', icon: Zap, label: 'Zap' },
  { id: 'Flame', icon: Flame, label: 'Flame' },
  { id: 'Rocket', icon: Rocket, label: 'Rocket' },
  { id: 'Crown', icon: Crown, label: 'Crown' },
  { id: 'Star', icon: Star, label: 'Star' },
  { id: 'Shield', icon: Shield, label: 'Shield' },
  { id: 'Heart', icon: Heart, label: 'Heart' },
  { id: 'Smile', icon: Smile, label: 'Smile' },
  { id: 'Code', icon: Code, label: 'Code' },
  { id: 'Terminal', icon: Terminal, label: 'Terminal' },
  { id: 'Cpu', icon: Cpu, label: 'Cpu' },
  { id: 'Layers', icon: Layers, label: 'Layers' },
  { id: 'Boxes', icon: Boxes, label: 'Boxes' },
  { id: 'Palette', icon: Palette, label: 'Palette' },
  { id: 'Brush', icon: Brush, label: 'Brush' },
  { id: 'Compass', icon: Compass, label: 'Compass' },
  { id: 'Feather', icon: Feather, label: 'Feather' },
  { id: 'PenTool', icon: PenTool, label: 'Pen Tool' },
  { id: 'Eye', icon: Eye, label: 'Eye' },
  { id: 'Camera', icon: Camera, label: 'Camera' },
  { id: 'Video', icon: Video, label: 'Video' },
  { id: 'Music', icon: Music, label: 'Music' },
  { id: 'Headphones', icon: Headphones, label: 'Headphones' },
  { id: 'Mic', icon: Mic, label: 'Mic' },
  { id: 'Radio', icon: Radio, label: 'Radio' },
  { id: 'Tv', icon: Tv, label: 'Tv' },
  { id: 'Monitor', icon: Monitor, label: 'Monitor' },
  { id: 'Smartphone', icon: Smartphone, label: 'Smartphone' },
  { id: 'Globe', icon: Globe, label: 'Globe' },
  { id: 'MapPin', icon: MapPin, label: 'Map Pin' },
  { id: 'Flag', icon: Flag, label: 'Flag' },
  { id: 'Anchor', icon: Anchor, label: 'Anchor' },
  { id: 'Sun', icon: Sun, label: 'Sun' },
  { id: 'Moon', icon: Moon, label: 'Moon' },
  { id: 'Cloud', icon: Cloud, label: 'Cloud' },
  { id: 'Wind', icon: Wind, label: 'Wind' },
  { id: 'Coffee', icon: Coffee, label: 'Coffee' },
  { id: 'Briefcase', icon: Briefcase, label: 'Briefcase' },
  { id: 'Target', icon: Target, label: 'Target' },
  { id: 'TrendingUp', icon: TrendingUp, label: 'Growth' },
  { id: 'Award', icon: Award, label: 'Award' },
  { id: 'Gem', icon: Gem, label: 'Gem' },
  { id: 'Key', icon: Key, label: 'Key' },
  { id: 'Lock', icon: Lock, label: 'Lock' },
  { id: 'Command', icon: Command, label: 'Command' },
  { id: 'Atom', icon: Atom, label: 'Atom' },
  { id: 'Lightbulb', icon: Lightbulb, label: 'Lightbulb' },
  { id: 'Infinity', icon: InfinityIcon, label: 'Infinity' },
];

export function renderUserIcon(iconId?: string | null, className = 'w-4 h-4 text-white') {
  if (!iconId) return null;
  const match = AVATAR_ICONS.find((item) => item.id === iconId);
  if (!match) return null;
  const IconComp = match.icon;
  return <IconComp className={className} />;
}

interface AvatarIconPickerProps {
  selectedIcon: string | null;
  onSelectIcon: (iconId: string) => void;
}

export function AvatarIconPicker({
  selectedIcon,
  onSelectIcon,
}: AvatarIconPickerProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = AVATAR_ICONS.filter((item) =>
    item.label.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-sans font-medium text-neutral-700 dark:text-neutral-300">
          Select Profile Icon (50 Icons Available)
        </label>
        <div className="relative w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search icon..."
            className="w-full pl-7 pr-2.5 py-1 text-xs border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors rounded-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950 rounded-lg max-h-56 overflow-y-auto">
        {filtered.map(({ id, icon: IconComponent, label }) => {
          const isSelected = selectedIcon === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectIcon(id)}
              title={label}
              className={`w-9 h-9 flex items-center justify-center transition-all cursor-pointer rounded-lg ${
                isSelected
                  ? 'bg-neutral-950 text-white ring-2 ring-neutral-950 dark:bg-white dark:text-black dark:ring-white shadow-sm'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <IconComponent className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
