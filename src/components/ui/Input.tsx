import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-mono text-xs uppercase tracking-wider font-semibold text-neutral-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-none border bg-neutral-900/90 px-3.5 py-2.5 text-sm font-sans text-white placeholder:text-neutral-500 transition-colors focus:outline-none ${
            error
              ? 'border-red-500 focus:border-red-400'
              : 'border-neutral-800 hover:border-neutral-600 focus:border-white'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1 font-mono text-xs text-red-400">{error}</p>
        ) : helperText ? (
          <p className="mt-1 font-mono text-xs text-neutral-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
