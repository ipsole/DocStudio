'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            itp_support?: boolean;
            context?: 'signin' | 'signup' | 'use';
          }) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
            getNotDisplayedReason: () => string;
            getSkippedReason: () => string;
            getDismissedReason: () => string;
          }) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleOneTapProps {
  context?: 'signin' | 'signup' | 'use';
  onSuccessRedirect?: string;
}

/**
 * Loads the Google Identity Services client library.
 */
function loadGsiScript(onLoad: () => void) {
  if (typeof window === 'undefined') return;

  if (window.google?.accounts?.id) {
    onLoad();
    return;
  }

  const scriptId = 'google-gsi-client-script';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = onLoad;
    document.body.appendChild(script);
  } else {
    script.addEventListener('load', onLoad);
  }
}

/**
 * Google One Tap: Floating instant 1-tap account prompt right on the screen.
 */
export function GoogleOneTap({
  context = 'signin',
  onSuccessRedirect = '/',
}: GoogleOneTapProps) {
  const { user, loading, signInWithGoogleCredential } = useAuth();
  const router = useRouter();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (loading || user) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    // Reset suppression cookie so Google One Tap isn't silently hidden after dismissal
    try {
      document.cookie = 'g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } catch {
      // ignore
    }

    loadGsiScript(() => {
      if (!window.google?.accounts?.id || initializedRef.current) return;
      initializedRef.current = true;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              try {
                await signInWithGoogleCredential(response.credential);
                router.push(onSuccessRedirect);
              } catch (err) {
                console.error('[Google One Tap] Sign in with credential failed:', err);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          context: context,
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.log(
              '[Google One Tap] Prompt not displayed:',
              notification.getNotDisplayedReason()
            );
          } else if (notification.isSkippedMoment()) {
            console.log(
              '[Google One Tap] Prompt skipped:',
              notification.getSkippedReason()
            );
          } else if (notification.isDismissedMoment()) {
            console.log(
              '[Google One Tap] Prompt dismissed:',
              notification.getDismissedReason()
            );
          }
        });
      } catch (err) {
        console.warn('[Google One Tap] Initialization error:', err);
      }
    });

    return () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [user, loading, signInWithGoogleCredential, router, context, onSuccessRedirect]);

  return null;
}

/**
 * In-Page Google Identity Services Native Button.
 * Renders the official Google button directly inside the page without popup windows.
 */
export function GoogleSignInButton({
  onSuccessRedirect = '/',
  className = '',
  fallback,
}: {
  onSuccessRedirect?: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { signInWithGoogleCredential } = useAuth();
  const router = useRouter();
  const [rendered, setRendered] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    loadGsiScript(() => {
      if (!window.google?.accounts?.id || !containerRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              try {
                await signInWithGoogleCredential(response.credential);
                router.push(onSuccessRedirect);
              } catch (err) {
                console.error('[Google GIS Button] Sign in error:', err);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          const parentWidth = containerRef.current.parentElement?.clientWidth || 340;
          window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: Math.min(parentWidth, 380),
          });
          setRendered(true);
        }
      } catch (err) {
        console.warn('[Google GIS Button] Render error:', err);
      }
    });
  }, [clientId, signInWithGoogleCredential, router, onSuccessRedirect]);

  if (!clientId) {
    return <>{fallback}</>;
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={containerRef}
        className={`w-full flex justify-center ${rendered ? 'block' : 'hidden'}`}
      />
      {!rendered && fallback}
    </div>
  );
}
