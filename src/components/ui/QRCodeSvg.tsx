'use client';

import React, { useMemo } from 'react';
import { generateQRCodeMatrix } from '@/lib/qr/qrcode';

interface QRCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

export function QRCodeSvg({
  value,
  size = 220,
  className = '',
  darkColor = '#000000',
  lightColor = '#ffffff',
}: QRCodeSvgProps) {
  const matrix = useMemo(() => {
    try {
      return generateQRCodeMatrix(value);
    } catch (err) {
      console.error('[QRCodeSvg] Error generating QR matrix:', err);
      return [];
    }
  }, [value]);

  if (!matrix || matrix.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 rounded-xl text-neutral-400 text-xs"
      >
        Failed to render QR
      </div>
    );
  }

  const matrixSize = matrix.length;
  const padding = 2; // modules padding around the QR code
  const viewBoxSize = matrixSize + padding * 2;

  return (
    <div
      className={`inline-block p-3 rounded-2xl bg-white shadow-md border border-neutral-200 dark:border-neutral-800 relative select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full"
        shapeRendering="crispEdges"
      >
        {/* Background */}
        <rect width={viewBoxSize} height={viewBoxSize} fill={lightColor} />

        {/* Modules */}
        {matrix.map((row, r) =>
          row.map((isDark, c) => {
            if (!isDark) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c + padding}
                y={r + padding}
                width={1}
                height={1}
                fill={darkColor}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}
