'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

export function QRCodeSvg({
  value,
  size = 230,
  className = '',
  darkColor = '#000000',
  lightColor = '#ffffff',
}: QRCodeSvgProps) {
  const [svgHtml, setSvgHtml] = useState<string>('');

  useEffect(() => {
    if (!value) {
      setSvgHtml('');
      return;
    }

    let isMounted = true;

    // ISO/IEC 18004 Standard QR generation with guaranteed 4-module quiet zone
    QRCode.toString(value, {
      type: 'svg',
      width: size,
      margin: 4, // 4-module quiet zone is mandatory for smartphone optical autofocus & edge detection
      errorCorrectionLevel: 'M',
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((svg) => {
        if (isMounted) setSvgHtml(svg);
      })
      .catch((err) => {
        console.error('[QRCodeSvg] Error generating QR SVG:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, darkColor, lightColor]);

  if (!svgHtml) {
    return (
      <div
        style={{ width: size + 16, height: size + 16 }}
        className="flex items-center justify-center bg-white rounded-3xl border border-neutral-200 text-neutral-400 text-xs shadow-inner"
      >
        <span className="animate-pulse">Generating QR...</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center p-2 rounded-3xl bg-white shadow-xl border border-neutral-200/90 select-none overflow-hidden ${className}`}
      style={{ width: size + 16, height: size + 16 }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
