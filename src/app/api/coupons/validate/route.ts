import { NextRequest, NextResponse } from 'next/server';
import { validateCouponServer } from '@/lib/couponsServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, userId, userEmail, username, amountInr } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, reason: 'Please enter a coupon code.' },
        { status: 400 }
      );
    }

    if (amountInr === undefined || typeof amountInr !== 'number') {
      return NextResponse.json(
        { valid: false, reason: 'Invalid cart total amount.' },
        { status: 400 }
      );
    }

    const result = await validateCouponServer({
      code,
      userId,
      userEmail,
      username,
      amountInr,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[API Validate Coupon] Error:', err);
    return NextResponse.json(
      { valid: false, reason: 'Unable to validate coupon at this time.' },
      { status: 500 }
    );
  }
}
