import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { consumeCredits } from '@/lib/firebase/db';

export const dynamic = 'force-dynamic';

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

/**
 * Deduct credits when a subdomain app executes an action (generate, export, run).
 */
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const body = await request.json().catch(() => ({}));
    const authHeader = request.headers.get('authorization');
    const appKeyHeader = request.headers.get('x-docstudio-app-key');
    const { auth: adminAuth } = getFirebaseAdmin();

    let verifiedUid: string | null = null;

    // Check server-to-server secret key or client Bearer ID Token
    const adminSecret = process.env.DOCSTORE_ADMIN_SECRET;
    const isAppKeyValid = adminSecret && appKeyHeader && appKeyHeader === adminSecret;

    if (isAppKeyValid) {
      verifiedUid = body.userId || body.uid || null;
    } else if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        verifiedUid = decodedToken.uid;
      } catch {
        return NextResponse.json(
          { success: false, error: 'INVALID_TOKEN', message: 'ID token verification failed' },
          { status: 401, headers: corsHeaders }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Valid Bearer token or x-docstudio-app-key header required.' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!verifiedUid) {
      return NextResponse.json(
        { success: false, error: 'MISSING_USER_ID', message: 'User ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { appId, amount = 1, action = 'generation', metadata } = body;

    if (!appId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_APP_ID', message: 'appId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const deductionAmount = Number(amount);
    if (isNaN(deductionAmount) || deductionAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'INVALID_AMOUNT', message: 'Amount must be greater than 0' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Atomically consume credits in Firestore
    const result = await consumeCredits(
      verifiedUid,
      appId,
      deductionAmount,
      action,
      metadata
    );

    if (!result.success) {
      const isInsufficient = result.error === 'INSUFFICIENT_CREDITS';
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'CONSUMPTION_FAILED',
          message: isInsufficient
            ? 'User has insufficient credits remaining for this action'
            : result.error,
          creditsRemaining: result.creditsRemaining,
          upgradeUrl: `${request.nextUrl.origin}/dashboard?upgrade=${appId}`,
        },
        { status: isInsufficient ? 402 : 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        consumed: deductionAmount,
        creditsRemaining: result.creditsRemaining,
        creditsUsed: result.creditsUsed,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: unknown) {
    console.error('[API /v1/credits/consume] Error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}
