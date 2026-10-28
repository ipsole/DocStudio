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
            className="block font-sans text-xs uppercase tracking-wider font-semibold text-neutral-800 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-none border bg-white px-3.5 py-2.5 text-sm font-sans text-neutral-950 placeholder:text-neutral-400 transition-colors focus:outline-none ${
            error
              ? 'border-red-500 focus:border-red-600'
              : 'border-neutral-300 hover:border-neutral-400 focus:border-neutral-950'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1 font-sans text-xs text-red-600">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
