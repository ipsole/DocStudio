import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { verifyAdminRequest } from '@/lib/adminAuthHelper';
import { DocApp, AppStatus, AppVisibility } from '@/types';
import { DEMO_APPS } from '@/lib/seedData';

// Helper to verify admin authorization securely
async function verifyAdminAuth(req: NextRequest) {
  return verifyAdminRequest(req);
}

// GET /api/admin/apps - List all catalog apps (including drafts/archived)
export async function GET(req: NextRequest) {
  const authCheck = await verifyAdminAuth(req);
  if (!authCheck.isAuthorized) {
    return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
  }

  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    return NextResponse.json({ success: true, data: DEMO_APPS });
  }

  try {
    const snap = await firestore.collection('apps').orderBy('createdAt', 'desc').get();
    let apps = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // If Firestore is unseeded, return demonstration catalog apps
    if (apps.length === 0) {
      apps = DEMO_APPS as any;
    }

    return NextResponse.json({ success: true, data: apps });
  } catch (err: unknown) {
    console.warn('[API Admin Apps] Could not query Firestore apps, returning DEMO_APPS fallback:', err);
    return NextResponse.json({ success: true, data: DEMO_APPS });
  }
}

// POST /api/admin/apps - Register a new software product
export async function POST(req: NextRequest) {
  const authCheck = await verifyAdminAuth(req);
  if (!authCheck.isAuthorized) {
    return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
  }

  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    return NextResponse.json(
      { success: false, error: 'Admin database connection unavailable.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const {
      name,
      slug,
      shortDescription,
      description,
      category,
      icon,
      status,
      visibility,
      applicationUrl,
      version,
      tags,
    } = body;

    // Strict validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Product name is required.' }, { status: 400 });
    }

    if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { success: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      );
    }

    const validStatuses: AppStatus[] = ['draft', 'coming_soon', 'active', 'archived'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const validVisibilities: AppVisibility[] = ['public', 'private'];
    if (!visibility || !validVisibilities.includes(visibility)) {
      return NextResponse.json(
        { success: false, error: `Visibility must be one of: ${validVisibilities.join(', ')}` },
        { status: 400 }
      );
    }

    // Application URL validation: prevent dangerous URI schemes
    if (applicationUrl) {
      const trimmedUrl = applicationUrl.trim();
      const isValidScheme = /^https?:\/\//i.test(trimmedUrl) || /^\//.test(trimmedUrl);
      if (!isValidScheme) {
        return NextResponse.json(
          { success: false, error: 'Application URL must start with https://, http://, or /' },
          { status: 400 }
        );
      }
    }

    // Check slug uniqueness
    const existingSlugSnap = await firestore
      .collection('apps')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!existingSlugSnap.empty) {
      return NextResponse.json(
        { success: false, error: 'A product with this slug already exists.' },
        { status: 409 }
      );
    }

    const newApp: Omit<DocApp, 'id'> = {
      slug: slug.trim(),
      name: name.trim(),
      shortDescription: (shortDescription || '').trim(),
      description: (description || '').trim(),
      category: (category || 'utilities').toLowerCase().trim(),
      icon: icon || 'Boxes',
      status,
      visibility,
      applicationUrl: applicationUrl ? applicationUrl.trim() : null,
      version: version ? version.trim() : '1.0.0',
      tags: Array.isArray(tags) ? tags.map((t: string) => String(t).trim()) : [],
      isDemo: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const docRef = await firestore.collection('apps').add(newApp);

    return NextResponse.json(
      { success: true, data: { id: docRef.id, ...newApp } },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[API Admin Apps] Error creating product:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error creating product.' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/apps - Update an existing product
export async function PUT(req: NextRequest) {
  const authCheck = await verifyAdminAuth(req);
  if (!authCheck.isAuthorized) {
    return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
  }

  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    return NextResponse.json(
      { success: false, error: 'Admin database connection unavailable.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required.' }, { status: 400 });
    }

    const appRef = firestore.collection('apps').doc(id);
    const existing = await appRef.get();
    if (!existing.exists) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }

    if (updates.applicationUrl) {
      const trimmedUrl = updates.applicationUrl.trim();
      const isValidScheme = /^https?:\/\//i.test(trimmedUrl) || /^\//.test(trimmedUrl);
      if (!isValidScheme) {
        return NextResponse.json(
          { success: false, error: 'Application URL must start with https://, http://, or /' },
          { status: 400 }
        );
      }
    }

    const cleanedUpdates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (updates.name) cleanedUpdates.name = updates.name.trim();
    if (updates.shortDescription !== undefined) cleanedUpdates.shortDescription = updates.shortDescription.trim();
    if (updates.description !== undefined) cleanedUpdates.description = updates.description.trim();
    if (updates.category) cleanedUpdates.category = updates.category.toLowerCase().trim();
    if (updates.status) cleanedUpdates.status = updates.status;
    if (updates.visibility) cleanedUpdates.visibility = updates.visibility;
    if (updates.applicationUrl !== undefined) cleanedUpdates.applicationUrl = updates.applicationUrl ? updates.applicationUrl.trim() : null;
    if (updates.version) cleanedUpdates.version = updates.version.trim();
    if (updates.icon) cleanedUpdates.icon = updates.icon;
    if (Array.isArray(updates.tags)) cleanedUpdates.tags = updates.tags;

    await appRef.update(cleanedUpdates);

    return NextResponse.json({ success: true, data: { id, ...cleanedUpdates } });
  } catch (err: unknown) {
    console.error('[API Admin Apps] Error updating product:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error updating product.' },
      { status: 500 }
    );
  }
}
