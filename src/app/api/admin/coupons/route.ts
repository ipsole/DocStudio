import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuthHelper';
import {
  listCouponsAdmin,
  saveCouponAdmin,
  toggleCouponAdmin,
  deleteCouponAdmin,
} from '@/lib/couponsServer';

export const dynamic = 'force-dynamic';

// GET: List all coupons
export async function GET(req: NextRequest) {
  const authCheck = await verifyAdminRequest(req);
  if (!authCheck.isAuthorized) {
    return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
  }

  try {
    const coupons = await listCouponsAdmin();
    return NextResponse.json({ success: true, data: coupons });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch coupons';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST: Create or update coupon
export async function POST(req: NextRequest) {
  const authCheck = await verifyAdminRequest(req);
  if (!authCheck.isAuthorized) {
    return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    const createdBy = authCheck.email || 'izackstudio1@gmail.com';
    const saved = await saveCouponAdmin({ ...body, createdBy });
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save coupon';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

// PATCH: Toggle active status
export async function PATCH(req: NextRequest) {
  const authCheck = await verifyAdminRequest(req);
  if (!authCheck.isAuthorized) {
    return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { code, active } = body;
    if (!code || typeof active !== 'boolean') {
      return NextResponse.json({ success: false, error: 'code and active (boolean) are required' }, { status: 400 });
    }
    await toggleCouponAdmin(code, active);
    return NextResponse.json({ success: true, message: `Coupon ${code} status updated.` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update coupon';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE: Delete coupon
export async function DELETE(req: NextRequest) {
  const authCheck = await verifyAdminRequest(req);
  if (!authCheck.isAuthorized) {
    return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ success: false, error: 'Coupon code query parameter required' }, { status: 400 });
    }
    await deleteCouponAdmin(code);
    return NextResponse.json({ success: true, message: `Coupon ${code} deleted.` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete coupon';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
