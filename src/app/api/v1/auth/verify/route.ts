import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { getAppSubscriptionAdmin, ensureDefaultUserSubscriptionsAdmin } from '@/lib/billingServer';

export const dynamic = 'force-dynamic';

/**
 * CORS headers allowing requests from any docdril subdomain (*.docdril.com) or localhost
 */
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-docstudio-app-key',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const body = await request.json().catch(() => ({}));
    const authHeader = request.headers.get('authorization');
    const appKeyHeader = request.headers.get('x-docstudio-app-key');
    const { auth: adminAuth } = getFirebaseAdmin();

    let verifiedUid: string | null = null;
    let verifiedEmail = body.email;
    let verifiedName: string | null = null;

    // Check server-to-server secret key or client Bearer ID Token
    const adminSecret = process.env.DOCSTORE_ADMIN_SECRET;
    const isAppKeyValid = adminSecret && appKeyHeader && appKeyHeader === adminSecret;

    if (isAppKeyValid) {
      verifiedUid = body.userId || body.uid || null;
      verifiedEmail = body.email || null;
      verifiedName = body.name || null;
    } else if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        verifiedUid = decodedToken.uid;
        verifiedEmail = decodedToken.email;
        verifiedName = decodedToken.name || null;
      } catch (tokenErr) {
        return NextResponse.json(
          { valid: false, error: 'INVALID_TOKEN', message: 'ID token verification failed' },
          { status: 401, headers: corsHeaders }
        );
      }
    } else {
      return NextResponse.json(
        { valid: false, error: 'UNAUTHORIZED', message: 'Valid Bearer token or x-docstudio-app-key header required.' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!verifiedUid) {
      return NextResponse.json(
        { valid: false, error: 'MISSING_CREDENTIALS', message: 'User ID or valid Bearer token is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const appId = body.appId || 'demo-canvas';

    // 2. Ensure user has default subscriptions seeded if new
    if (verifiedEmail) {
      await ensureDefaultUserSubscriptionsAdmin(verifiedUid, verifiedEmail);
    }

    // 3. Fetch app subscription & credit balance using Admin SDK
    const subscription = await getAppSubscriptionAdmin(verifiedUid, appId);

    if (!subscription) {
      return NextResponse.json(
        {
          valid: true,
          authenticated: true,
          user: {
            uid: verifiedUid,
            email: verifiedEmail || '',
            displayName: verifiedName,
          },
          hasAccess: false,
          subscription: null,
          message: `No active subscription found for app ${appId}`,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    return NextResponse.json(
      {
        valid: true,
        authenticated: true,
        user: {
          uid: verifiedUid,
          email: verifiedEmail || subscription.userEmail,
          displayName: verifiedName,
        },
        hasAccess: isActive,
        subscription: {
          appId: subscription.appId,
          appName: subscription.appName,
          plan: subscription.plan,
          status: subscription.status,
          creditsRemaining: subscription.creditsRemaining,
          creditsTotal: subscription.creditsTotal,
          creditsUsed: subscription.creditsUsed,
          features: subscription.features,
          validUntil: subscription.validUntil,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: unknown) {
    console.error('[API /v1/auth/verify] Error:', error);
    return NextResponse.json(
      { valid: false, error: 'INTERNAL_ERROR', message: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}
