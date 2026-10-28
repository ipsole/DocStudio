import { NextRequest, NextResponse } from 'next/server';
import { getAppSubscription } from '@/lib/firebase/db';

export const dynamic = 'force-dynamic';

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const appId = searchParams.get('appId');

  if (!userId || !appId) {
    return NextResponse.json(
      { success: false, error: 'MISSING_PARAMS', message: 'Both userId and appId are required' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const sub = await getAppSubscription(userId, appId);
    if (!sub) {
      return NextResponse.json(
        {
          success: true,
          exists: false,
          creditsRemaining: 0,
          creditsTotal: 0,
          status: 'none',
        },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        exists: true,
        appId: sub.appId,
        plan: sub.plan,
        status: sub.status,
        creditsRemaining: sub.creditsRemaining,
        creditsTotal: sub.creditsTotal,
        creditsUsed: sub.creditsUsed,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}
