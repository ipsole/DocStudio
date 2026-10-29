import React from 'react';

interface VerifiedBadgeProps {
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VerifiedBadge({
  className = '',
  title = 'Verified unique creator handle',
  size = 'md',
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const finalClass = className || sizeClasses[size];

  return (
    <span
      className="inline-flex items-center justify-center shrink-0 align-middle select-none"
      title={title}
      aria-label={title}
    >
      <svg
        className={finalClass}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Scalloped verification seal */}
        <path
          d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238.65 1.273 2.02 2.148 3.6 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z"
          fill="#3B82F6"
        />
        {/* Crisp white checkmark */}
        <path
          d="M7.5 12.2l3.1 3.1 6.2-6.4"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
