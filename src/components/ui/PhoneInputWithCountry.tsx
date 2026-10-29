'use client';

import React, { useId } from 'react';
import { ChevronDown, Phone } from 'lucide-react';

export interface CountryOption {
  code: string;
  country: string;
  name: string;
  flag: string;
  placeholder: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: '+91', country: 'IN', name: 'India', flag: '🇮🇳', placeholder: '98765 43210' },
  { code: '+1', country: 'US', name: 'United States', flag: '🇺🇸', placeholder: '(555) 000-0000' },
  { code: '+44', country: 'GB', name: 'United Kingdom', flag: '🇬🇧', placeholder: '7911 123456' },
  { code: '+1', country: 'CA', name: 'Canada', flag: '🇨🇦', placeholder: '(555) 000-0000' },
  { code: '+971', country: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', placeholder: '50 123 4567' },
  { code: '+61', country: 'AU', name: 'Australia', flag: '🇦🇺', placeholder: '412 345 678' },
  { code: '+49', country: 'DE', name: 'Germany', flag: '🇩🇪', placeholder: '151 23456789' },
  { code: '+65', country: 'SG', name: 'Singapore', flag: '🇸🇬', placeholder: '8123 4567' },
  { code: '+33', country: 'FR', name: 'France', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
  { code: '+81', country: 'JP', name: 'Japan', flag: '🇯🇵', placeholder: '90 1234 5678' },
  { code: '+55', country: 'BR', name: 'Brazil', flag: '🇧🇷', placeholder: '11 91234-5678' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', placeholder: '50 123 4567' },
  { code: '+86', country: 'CN', name: 'China', flag: '🇨🇳', placeholder: '138 0000 0000' },
  { code: '+82', country: 'KR', name: 'South Korea', flag: '🇰🇷', placeholder: '10-1234-5678' },
  { code: '+39', country: 'IT', name: 'Italy', flag: '🇮🇹', placeholder: '312 3456789' },
  { code: '+34', country: 'ES', name: 'Spain', flag: '🇪🇸', placeholder: '612 34 56 78' },
  { code: '+31', country: 'NL', name: 'Netherlands', flag: '🇳🇱', placeholder: '6 12345678' },
  { code: '+41', country: 'CH', name: 'Switzerland', flag: '🇨🇭', placeholder: '78 123 45 67' },
  { code: '+46', country: 'SE', name: 'Sweden', flag: '🇸🇪', placeholder: '70 123 45 67' },
  { code: '+62', country: 'ID', name: 'Indonesia', flag: '🇮🇩', placeholder: '812-3456-7890' },
  { code: '+60', country: 'MY', name: 'Malaysia', flag: '🇲🇾', placeholder: '12-345 6789' },
  { code: '+63', country: 'PH', name: 'Philippines', flag: '🇵🇭', placeholder: '917 123 4567' },
  { code: '+64', country: 'NZ', name: 'New Zealand', flag: '🇳🇿', placeholder: '21 123 4567' },
  { code: '+27', country: 'ZA', name: 'South Africa', flag: '🇿🇦', placeholder: '71 123 4567' },
  { code: '+234', country: 'NG', name: 'Nigeria', flag: '🇳🇬', placeholder: '802 123 4567' },
];

interface PhoneInputWithCountryProps {
  countryCode: string;
  setCountryCode: (code: string) => void;
  nationalNumber: string;
  setNationalNumber: (num: string) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  autoFocus?: boolean;
}

export function PhoneInputWithCountry({
  countryCode,
  setCountryCode,
  nationalNumber,
  setNationalNumber,
  disabled = false,
  required = true,
  id,
  autoFocus = false,
}: PhoneInputWithCountryProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const currentCountry =
    COUNTRIES.find((c) => c.code === countryCode) ||
    COUNTRIES[0]; // Default to India (+91)

  // Smart handle changes and paste
  const handleNumberChange = (raw: string) => {
    let clean = raw.trim();

    // If user pasted a full number with +country code
    if (clean.startsWith('+')) {
      for (const country of COUNTRIES) {
        if (clean.startsWith(country.code)) {
          setCountryCode(country.code);
          clean = clean.slice(country.code.length).trim();
          break;
        }
      }
    }

    // Strip characters that aren't digits, spaces, or hyphens
    clean = clean.replace(/[^0-9\s-]/g, '');
    setNationalNumber(clean);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block font-sans text-xs font-semibold text-neutral-800 dark:text-neutral-200"
        >
          Phone Number
        </label>
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          SMS OTP Verification
        </span>
      </div>

      {/* Main Composite Input Box with Distinct Highlighted Country Code */}
      <div className="group flex rounded-xl border-2 border-neutral-200 dark:border-neutral-800 focus-within:border-neutral-950 dark:focus-within:border-white bg-white dark:bg-neutral-900/90 shadow-sm transition-all overflow-hidden">
        {/* Highlighted Country Code Selector */}
        <div
          className="relative flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-750 border-r-2 border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 shrink-0 transition-colors cursor-pointer select-none"
          title="Click to select country code"
        >
          <span className="text-lg leading-none" role="img" aria-label={currentCountry.name}>
            {currentCountry.flag}
          </span>
          <span className="font-mono font-bold text-xs tracking-tight text-neutral-950 dark:text-white bg-neutral-200/70 dark:bg-neutral-700/60 px-1.5 py-0.5 rounded">
            {currentCountry.code}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 transition-transform group-hover:translate-y-0.5" />

          {/* Invisible native select overlay for seamless device interaction */}
          <select
            value={`${currentCountry.country}-${currentCountry.code}`}
            onChange={(e) => {
              const [countryAbbr, dialCode] = e.target.value.split('-');
              const match = COUNTRIES.find(
                (c) => c.country === countryAbbr && c.code === dialCode
              );
              if (match) {
                setCountryCode(match.code);
              }
            }}
            disabled={disabled}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            aria-label="Select Country Code"
          >
            {COUNTRIES.map((c, idx) => (
              <option
                key={`${c.country}-${c.code}-${idx}`}
                value={`${c.country}-${c.code}`}
                className="text-neutral-950 dark:text-neutral-950"
              >
                {c.flag} {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* National Number Input Field */}
        <div className="relative flex-1 flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Phone className="w-4 h-4" />
          </div>
          <input
            id={inputId}
            type="tel"
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            value={nationalNumber}
            onChange={(e) => handleNumberChange(e.target.value)}
            placeholder={currentCountry.placeholder}
            className="w-full h-full bg-transparent pl-9 pr-3.5 py-2.5 text-sm font-mono font-medium text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Live Formatted Confirmation Preview */}
      <div className="flex items-center justify-between text-[11px] font-sans text-neutral-500 dark:text-neutral-400 pt-0.5 px-0.5">
        <span>
          Verification code will be sent to:{' '}
          <strong className="font-mono text-neutral-900 dark:text-neutral-200 font-bold bg-neutral-100 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
            {currentCountry.code} {nationalNumber || '••••••••••'}
          </strong>
        </span>
      </div>
    </div>
  );
}
