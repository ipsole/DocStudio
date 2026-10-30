'use client';

import React, { useEffect, useState } from 'react';
import * as QRCodeModule from 'qrcode';

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
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgHtml, setSvgHtml] = useState<string>('');

  useEffect(() => {
    if (!value) {
      setDataUrl('');
      setSvgHtml('');
      return;
    }

    let isMounted = true;
    const qrLib: any = (QRCodeModule as any).default || QRCodeModule;

    function tryGenerateSvg() {
      if (typeof qrLib.toString === 'function') {
        qrLib.toString(
          value,
          {
            type: 'svg',
            width: size,
            margin: 4,
            errorCorrectionLevel: 'M',
            color: {
              dark: darkColor,
              light: lightColor,
            },
          },
          (svgErr: any, svg: string) => {
            if (isMounted && !svgErr && svg) {
              setSvgHtml(svg);
            }
          }
        );
      }
    }

    // 1. Try High-Resolution Data URL (PNG) first
    if (typeof qrLib.toDataURL === 'function') {
      try {
        qrLib.toDataURL(
          value,
          {
            width: Math.max(size * 2, 460),
            margin: 4, // ISO 18004 4-module quiet zone is mandatory for smartphone autofocus
            errorCorrectionLevel: 'M',
            color: {
              dark: darkColor,
              light: lightColor,
            },
          },
          (err: any, url: string) => {
            if (!isMounted) return;
            if (!err && url) {
              setDataUrl(url);
            } else {
              tryGenerateSvg();
            }
          }
        );
      } catch {
        tryGenerateSvg();
      }
    } else {
      tryGenerateSvg();
    }

    return () => {
      isMounted = false;
    };
  }, [value, size, darkColor, lightColor]);

  if (!dataUrl && !svgHtml) {
    return (
      <div
        style={{ width: size + 16, height: size + 16 }}
        className="flex flex-col items-center justify-center bg-white rounded-3xl border border-neutral-200 text-neutral-400 text-xs shadow-inner gap-2"
      >
        <div className="w-5 h-5 rounded-full border-2 border-neutral-300 border-t-neutral-800 animate-spin" />
        <span className="text-[11px] font-mono text-neutral-400">Rendering QR Code...</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center p-3 rounded-3xl bg-white shadow-xl border border-neutral-200 select-none overflow-hidden ${className}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      {dataUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={dataUrl}
          alt="DocStudio Instant Login QR Code"
          width={size}
          height={size}
          className="w-full h-full object-contain block"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      )}
    </div>
  );
}
