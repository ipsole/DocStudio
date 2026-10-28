import React from 'react';
import {
  Crown,
  Palette,
  Film,
  Sparkles,
  Boxes,
  PenTool,
  Terminal,
  Headphones,
  Gem,
  Star,
  Flame,
  Zap,
  Compass,
  Feather,
  Rocket,
  Atom,
  Shield,
  Heart,
  Smile,
  Infinity as InfinityIcon,
  User,
  LucideIcon,
  Code,
  Cpu,
  Layers,
  Brush,
  Eye,
  Camera,
  Video,
  Music,
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
  Key,
  Lock,
  Command,
  Lightbulb,
} from 'lucide-react';

export interface StudioPersona {
  id: string;
  name: string;
  role: string;
  icon: LucideIcon;
  gradient: string;
  accentRing: string;
  badgeBg: string;
  badgeText: string;
}

export interface GradientMonogram {
  id: string;
  name: string;
  gradient: string;
  border: string;
  accent: string;
}

export interface CuratedEmblem {
  id: string;
  label: string;
  icon: LucideIcon;
  category: 'creative' | 'tech' | 'luxury' | 'vitality';
}

export const STUDIO_PERSONAS: StudioPersona[] = [
  {
    id: 'persona-director',
    name: 'Creative Director',
    role: 'Studio Vision & Leadership',
    icon: Crown,
    gradient: 'from-amber-600 via-amber-500 to-yellow-400',
    accentRing: 'ring-amber-500/40 border-amber-500/50',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    badgeText: 'Leadership',
  },
  {
    id: 'persona-art',
    name: 'Art Director',
    role: 'Visual Design & Aesthetics',
    icon: Palette,
    gradient: 'from-rose-600 via-pink-500 to-purple-500',
    accentRing: 'ring-rose-500/40 border-rose-500/50',
    badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
    badgeText: 'Design',
  },
  {
    id: 'persona-motion',
    name: 'Motion Lead',
    role: 'Keyframes & Kinetic Animation',
    icon: Film,
    gradient: 'from-indigo-600 via-purple-600 to-cyan-400',
    accentRing: 'ring-indigo-500/40 border-indigo-500/50',
    badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    badgeText: 'Motion',
  },
  {
    id: 'persona-ai',
    name: 'Prompt Architect',
    role: 'Neural Engines & Generative AI',
    icon: Sparkles,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-400',
    accentRing: 'ring-emerald-500/40 border-emerald-500/50',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    badgeText: 'Generative AI',
  },
  {
    id: 'persona-3d',
    name: '3D Sculptor',
    role: 'Spatial, Lighting & Meshes',
    icon: Boxes,
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
    accentRing: 'ring-sky-500/40 border-sky-500/50',
    badgeBg: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400',
    badgeText: 'Spatial 3D',
  },
  {
    id: 'persona-vector',
    name: 'Vector Artisan',
    role: 'Lossless Geometry & Branding',
    icon: PenTool,
    gradient: 'from-orange-500 via-rose-500 to-red-600',
    accentRing: 'ring-orange-500/40 border-orange-500/50',
    badgeBg: 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
    badgeText: 'Vector Lab',
  },
  {
    id: 'persona-code',
    name: 'Code Weaver',
    role: 'Pipeline & Frontend Systems',
    icon: Terminal,
    gradient: 'from-emerald-600 via-teal-700 to-neutral-900',
    accentRing: 'ring-teal-500/40 border-teal-500/50',
    badgeBg: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400',
    badgeText: 'Engineering',
  },
  {
    id: 'persona-sound',
    name: 'Audio Designer',
    role: 'Scoring, FX & Studio Sound',
    icon: Headphones,
    gradient: 'from-yellow-500 via-amber-600 to-orange-600',
    accentRing: 'ring-amber-500/40 border-amber-500/50',
    badgeBg: 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    badgeText: 'Audio FX',
  },
];

export const GRADIENT_MONOGRAMS: GradientMonogram[] = [
  {
    id: 'grad-obsidian',
    name: 'Obsidian Velvet',
    gradient: 'from-neutral-950 via-neutral-900 to-neutral-800',
    border: 'border-neutral-700/80',
    accent: 'bg-neutral-800',
  },
  {
    id: 'grad-emerald',
    name: 'Emerald Nebula',
    gradient: 'from-emerald-950 via-emerald-800 to-teal-600',
    border: 'border-emerald-600/40',
    accent: 'bg-emerald-700',
  },
  {
    id: 'grad-violet',
    name: 'Royal Indigo',
    gradient: 'from-neutral-950 via-indigo-900 to-purple-600',
    border: 'border-purple-600/40',
    accent: 'bg-purple-700',
  },
  {
    id: 'grad-sunset',
    name: 'Solar Flare',
    gradient: 'from-neutral-950 via-rose-900 to-amber-600',
    border: 'border-rose-500/40',
    accent: 'bg-rose-700',
  },
  {
    id: 'grad-azure',
    name: 'Deep Pacific',
    gradient: 'from-neutral-950 via-blue-900 to-cyan-600',
    border: 'border-cyan-500/40',
    accent: 'bg-cyan-700',
  },
  {
    id: 'grad-gold',
    name: 'Champagne Bronze',
    gradient: 'from-neutral-950 via-amber-950 to-amber-600',
    border: 'border-amber-500/40',
    accent: 'bg-amber-700',
  },
];

export const CURATED_EMBLEMS: CuratedEmblem[] = [
  { id: 'Sparkles', label: 'Magic Spark', icon: Sparkles, category: 'creative' },
  { id: 'Crown', label: 'Sovereign Crown', icon: Crown, category: 'luxury' },
  { id: 'Gem', label: 'Flawless Diamond', icon: Gem, category: 'luxury' },
  { id: 'Star', label: 'Stellar Star', icon: Star, category: 'creative' },
  { id: 'Palette', label: 'Color Studio', icon: Palette, category: 'creative' },
  { id: 'Terminal', label: 'Command Shell', icon: Terminal, category: 'tech' },
  { id: 'Flame', label: 'Creative Fire', icon: Flame, category: 'vitality' },
  { id: 'Zap', label: 'Electric Pulse', icon: Zap, category: 'tech' },
  { id: 'Compass', label: 'Navigator', icon: Compass, category: 'creative' },
  { id: 'Feather', label: 'Artisan Quill', icon: Feather, category: 'creative' },
  { id: 'Rocket', label: 'Studio Launch', icon: Rocket, category: 'tech' },
  { id: 'Atom', label: 'Quantum Engine', icon: Atom, category: 'tech' },
  { id: 'Shield', label: 'Guardian Crest', icon: Shield, category: 'luxury' },
  { id: 'Heart', label: 'Studio Passion', icon: Heart, category: 'vitality' },
  { id: 'Smile', label: 'Positive Aura', icon: Smile, category: 'vitality' },
  { id: 'Infinity', label: 'Endless Flow', icon: InfinityIcon, category: 'luxury' },
];

/**
 * Full fallback dictionary preserving every legacy icon identifier
 */
export const ALL_LEGACY_ICONS: Record<string, LucideIcon> = {
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
  Infinity: InfinityIcon,
};
