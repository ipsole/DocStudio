import React from 'react';
import { AppStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  const variants = {
    default: 'bg-white text-neutral-900 border-neutral-300',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-800 border-amber-300',
    info: 'bg-neutral-950 text-white border-neutral-950',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-[11px] px-2 py-0.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-sans uppercase tracking-wider border rounded-none font-semibold ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: AppStatus }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 bg-emerald-600 mr-0.5" />
          Active
        </Badge>
      );
    case 'coming_soon':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 bg-amber-600 mr-0.5" />
          Coming Soon
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="neutral">
          <span className="w-1.5 h-1.5 bg-neutral-400 mr-0.5" />
          Draft
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="default">
          <span className="w-1.5 h-1.5 bg-neutral-400 mr-0.5" />
          Archived
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}
