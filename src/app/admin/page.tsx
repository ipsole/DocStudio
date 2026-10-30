'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DocApp, AppStatus, AppVisibility, Coupon, CouponDiscountType, CouponTargetType } from '@/types';
import { SUPER_ADMIN_EMAIL } from '@/lib/adminConfig';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Shield,
  Plus,
  RefreshCw,
  Edit2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Database,
  Eye,
  EyeOff,
  Tag,
  Trash2,
  Copy,
  Check,
  Users,
  UserCheck,
  Calendar,
  Percent,
  Sparkles,
  X,
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<DocApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'catalog' | 'coupons'>('catalog');

  // Coupon state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponSaving, setCouponSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [couponFormData, setCouponFormData] = useState<{
    code: string;
    description: string;
    discountType: CouponDiscountType;
    discountValue: number;
    targetType: CouponTargetType;
    targetValue: string;
    singleUsePerUser: boolean;
    maxTotalUses: string;
    expiresAt: string;
  }>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 20,
    targetType: 'all',
    targetValue: '',
    singleUsePerUser: true,
    maxTotalUses: '',
    expiresAt: '',
  });

  const openCreateCouponModal = () => {
    setEditingCoupon(null);
    setCouponFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 20,
      targetType: 'all',
      targetValue: '',
      singleUsePerUser: true,
      maxTotalUses: '',
      expiresAt: '',
    });
    setIsCouponModalOpen(true);
  };

  const openEditCouponModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    let expiresStr = '';
    if (coupon.expiresAt) {
      const d = new Date(coupon.expiresAt);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      expiresStr = `${year}-${month}-${day}`;
    }
    setCouponFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      targetType: coupon.targetType,
      targetValue: coupon.targetValue || '',
      singleUsePerUser: coupon.singleUsePerUser ?? true,
      maxTotalUses: coupon.maxTotalUses ? String(coupon.maxTotalUses) : '',
      expiresAt: expiresStr,
    });
    setIsCouponModalOpen(true);
  };

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<DocApp | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Form fields
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    category: string;
    status: AppStatus;
    visibility: AppVisibility;
    applicationUrl: string;
    version: string;
    tags: string;
    icon: string;
  }>({
    name: '',
    slug: '',
    shortDescription: '',
    description: '',
    category: 'creative',
    status: 'draft',
    visibility: 'public',
    applicationUrl: '',
    version: '1.0.0',
    tags: '',
    icon: 'Boxes',
  });

  const loadAdminApps = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/apps', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setApps(data.data);
      } else {
        setError(data.error || 'Failed to fetch catalog.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching catalog.');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminCoupons = async () => {
    if (!user) return;
    setCouponsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data || []);
      }
    } catch (err: unknown) {
      console.warn('Error loading coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminApps();
    loadAdminCoupons();
  }, [user]);

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCouponSaving(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const payload = {
        code: couponFormData.code.trim().toUpperCase(),
        originalCode: editingCoupon ? editingCoupon.code : undefined,
        description: couponFormData.description.trim(),
        discountType: couponFormData.discountType,
        discountValue: Number(couponFormData.discountValue),
        targetType: couponFormData.targetType,
        targetValue: couponFormData.targetType === 'user' ? couponFormData.targetValue.trim() : undefined,
        singleUsePerUser: couponFormData.singleUsePerUser,
        maxTotalUses: couponFormData.maxTotalUses ? Number(couponFormData.maxTotalUses) : undefined,
        expiresAt: couponFormData.expiresAt ? new Date(couponFormData.expiresAt).getTime() : null,
      };

      const url = '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save coupon.');
      }

      setSuccessMsg(
        editingCoupon
          ? `Coupon "${payload.code}" updated successfully!`
          : `Coupon "${payload.code}" created successfully!`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      await loadAdminCoupons();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving coupon.');
    } finally {
      setCouponSaving(false);
    }
  };

  const handleToggleCoupon = async (code: string, currentActive: boolean) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, active: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.code === code ? { ...c, active: !currentActive } : c))
        );
      }
    } catch (err) {
      console.error('Error toggling coupon:', err);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) => prev.filter((c) => c.code !== code));
        setSuccessMsg(`Coupon "${code}" deleted.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting coupon:', err);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openCreateModal = () => {
    setEditingApp(null);
    setFormData({
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      category: 'creative',
      status: 'draft',
      visibility: 'public',
      applicationUrl: '',
      version: '1.0.0',
      tags: '',
      icon: 'Boxes',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (app: DocApp) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      slug: app.slug,
      shortDescription: app.shortDescription,
      description: app.description,
      category: app.category,
      status: app.status,
      visibility: app.visibility,
      applicationUrl: app.applicationUrl || '',
      version: app.version || '1.0.0',
      tags: app.tags ? app.tags.join(', ') : '',
      icon: app.icon || 'Boxes',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormSaving(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const payload = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        applicationUrl: formData.applicationUrl.trim() || null,
      };

      const url = '/api/admin/apps';
      const method = editingApp ? 'PUT' : 'POST';
      const body = editingApp ? { id: editingApp.id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Operation failed.');
      }

      setSuccessMsg(editingApp ? 'Product updated successfully.' : 'Product registered successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsModalOpen(false);
      await loadAdminApps();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleSeedDemoData = async () => {
    if (!user) return;
    if (!confirm('Seed demonstration applications into Firestore?')) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(null), 4000);
        await loadAdminApps();
      } else {
        setError(data.error);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to seed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-12 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                PRIVILEGED INTERFACE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-[10px] font-mono font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {SUPER_ADMIN_EMAIL}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-[-0.03em] uppercase text-neutral-950 dark:text-white font-sans">
              Admin Control Center
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans">
              Manage software catalog entries, create targeted discount coupons, and oversee platform billing.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {activeTab === 'catalog' ? (
              <>
                <Button variant="secondary" size="sm" onClick={handleSeedDemoData} className="gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Seed Demo
                </Button>
                <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  New Product
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={openCreateCouponModal}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Coupon
              </Button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl font-sans text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Software Catalog ({apps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 rounded-xl font-sans text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Coupons & Discounts</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono">
              {coupons.length}
            </span>
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 border border-red-300 bg-red-50 text-red-700 dark:border-red-800/80 dark:bg-red-950/70 dark:text-red-300 font-mono text-xs uppercase tracking-wider flex items-center justify-between rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-bold underline cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/70 dark:text-emerald-300 font-mono text-xs uppercase tracking-wider flex items-center gap-2 rounded-lg">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Catalog Table or Coupons Section */}
        {activeTab === 'catalog' ? (
          <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 overflow-hidden rounded-xl shadow-sm dark:shadow-xl text-neutral-900 dark:text-white">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-wider font-bold text-neutral-950 dark:text-white">
              REGISTERED CATALOG ITEMS ({apps.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAdminApps}
              className="gap-1.5 text-xs font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              REFRESH
            </Button>
          </div>

          {loading ? (
            <div className="p-16 text-center font-mono text-xs uppercase text-neutral-400">
              Loading catalog from Firestore...
            </div>
          ) : apps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">Slug</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Visibility</th>
                    <th className="py-3.5 px-4">Launch Endpoint</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-neutral-950 dark:text-white flex items-center gap-2">
                        <span>{app.name}</span>
                        {app.isDemo && (
                          <Badge variant="neutral" size="sm">
                            DEMO
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400">{app.slug}</td>
                      <td className="py-3 px-4 uppercase">{app.category}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3 px-4">
                        {app.visibility === 'public' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Eye className="w-3 h-3" />
                            PUBLIC
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-neutral-400">
                            <EyeOff className="w-3 h-3" />
                            PRIVATE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate">
                        {app.applicationUrl ? (
                          <a
                            href={app.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-950 dark:text-white underline inline-flex items-center gap-1 hover:text-neutral-600 dark:hover:text-neutral-300"
                          >
                            <span className="truncate">{app.applicationUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-neutral-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(app)}
                          className="gap-1 font-mono text-xs"
                        >
                          <Edit2 className="w-3 h-3" />
                          EDIT
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center font-mono text-xs text-neutral-500 dark:text-neutral-400 uppercase">
              No products found in Firestore. Click &ldquo;New Product&rdquo; or &ldquo;Seed Demo&rdquo; to populate.
            </div>
          )}
        </div>
        ) : (
          /* Coupons & Discounts Dedicated Section for Super Admin */
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm space-y-1">
                <div className="text-xs font-sans text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                  <span>Total Promo Coupons</span>
                  <Tag className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="text-2xl font-bold font-sans text-neutral-950 dark:text-white">
                  {coupons.length}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  {coupons.filter((c) => c.active).length} active coupons
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm space-y-1">
                <div className="text-xs font-sans text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                  <span>Single-User Targeted</span>
                  <UserCheck className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold font-sans text-neutral-950 dark:text-white">
                  {coupons.filter((c) => c.targetType === 'user').length}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  Locked to specific usernames
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm space-y-1">
                <div className="text-xs font-sans text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                  <span>Total Cart Redemptions</span>
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold font-sans text-neutral-950 dark:text-white">
                  {coupons.reduce((sum, c) => sum + (c.currentUses || 0), 0)}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  Times redeemed across checkout
                </div>
              </div>
            </div>

            {/* Coupons Table */}
            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 overflow-hidden rounded-xl shadow-sm dark:shadow-xl text-neutral-900 dark:text-white">
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <h2 className="font-mono text-xs uppercase tracking-wider font-bold text-neutral-950 dark:text-white">
                    COUPON DISCOUNTS ({coupons.length})
                  </h2>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                    Define discount amounts and lock coupons to specific username IDs with one-time use restrictions.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadAdminCoupons}
                  className="gap-1.5 text-xs font-mono"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${couponsLoading ? 'animate-spin' : ''}`} />
                  REFRESH
                </Button>
              </div>

              {couponsLoading ? (
                <div className="p-16 text-center font-mono text-xs uppercase text-neutral-400">
                  Loading coupons from Firestore...
                </div>
              ) : coupons.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Coupon Code</th>
                        <th className="py-3.5 px-4">Discount</th>
                        <th className="py-3.5 px-4">Target Scope</th>
                        <th className="py-3.5 px-4">Per-User Limit</th>
                        <th className="py-3.5 px-4">Redemptions</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {coupons.map((coupon) => (
                        <tr
                          key={coupon.id}
                          className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-neutral-950 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 font-mono text-xs font-bold tracking-wider">
                                {coupon.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyCouponCode(coupon.code)}
                                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                title="Copy code"
                              >
                                {copiedCode === coupon.code ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            {coupon.description && (
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans mt-0.5 max-w-xs truncate">
                                {coupon.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                            {coupon.discountType === 'percentage' ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                {coupon.discountValue}% OFF
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                ₹{coupon.discountValue} OFF
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {coupon.targetType === 'user' && coupon.targetValue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-sans font-semibold">
                                <UserCheck className="w-3 h-3" />
                                @{coupon.targetValue}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] font-sans">
                                <Users className="w-3 h-3" />
                                All Users
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs font-sans">
                            {coupon.singleUsePerUser ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                1x Per User
                              </span>
                            ) : (
                              <span className="text-neutral-500">Reusable</span>
                            )}
                            {coupon.maxTotalUses ? (
                              <span className="text-neutral-400 text-[11px] block font-mono">
                                Max {coupon.maxTotalUses} total
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-900 dark:text-white">
                            {coupon.currentUses || 0}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleCoupon(coupon.code, coupon.active)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold transition-all cursor-pointer ${
                                coupon.active
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-300'
                              }`}
                            >
                              {coupon.active ? 'Active' : 'Disabled'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditCouponModal(coupon)}
                                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                title="Edit coupon"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(coupon.code)}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                                title="Delete coupon"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center space-y-3">
                  <Tag className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400 uppercase">
                    No active discount coupons found.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateCouponModal}
                  >
                    Create Your First Coupon
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Create Coupon */}
        {isCouponModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-w-lg w-full p-6 sm:p-8 space-y-6 rounded-2xl my-8 text-neutral-900 dark:text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div className="space-y-0.5">
                  <h3 className="font-light text-2xl tracking-[-0.03em] uppercase text-neutral-950 dark:text-white font-sans">
                    {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Discount Coupon'}
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans">
                    Authorized Super Admin: {user?.email || SUPER_ADMIN_EMAIL}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCouponModalOpen(false);
                    setEditingCoupon(null);
                  }}
                  className="font-mono text-sm font-bold text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} className="space-y-4">
                {/* Coupon Code */}
                <div>
                  <label className="block font-sans text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Coupon Code (Uppercase Alphanumeric) *
                  </label>
                  <input
                    type="text"
                    required
                    value={couponFormData.code}
                    onChange={(e) =>
                      setCouponFormData((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
                      }))
                    }
                    placeholder="e.g. SPECIAL50, LAUNCH100, VIPONLY"
                    className="w-full border border-neutral-300 dark:border-neutral-700 px-3.5 py-2.5 text-xs font-mono uppercase text-neutral-950 dark:text-white bg-white dark:bg-neutral-900 rounded-xl focus:outline-none focus:border-neutral-950 dark:focus:border-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-sans text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Description / Purpose (Optional)
                  </label>
                  <input
                    type="text"
                    value={couponFormData.description}
                    onChange={(e) =>
                      setCouponFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="e.g. Exclusive 50% discount for beta testing"
                    className="w-full border border-neutral-300 dark:border-neutral-700 px-3.5 py-2.5 text-xs font-sans text-neutral-950 dark:text-white bg-white dark:bg-neutral-900 rounded-xl focus:outline-none focus:border-neutral-950 dark:focus:border-white"
                  />
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={couponFormData.discountType}
                      onChange={(e) =>
                        setCouponFormData((prev) => ({
                          ...prev,
                          discountType: e.target.value as CouponDiscountType,
                        }))
                      }
                      className="w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 text-xs font-sans text-neutral-950 dark:text-white bg-white dark:bg-neutral-900 rounded-xl focus:outline-none focus:border-neutral-950 dark:focus:border-white"
                    >
                      <option value="percentage">Percentage Off (%)</option>
                      <option value="flat">Flat Amount Off (₹ INR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-sans text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      {couponFormData.discountType === 'percentage'
                        ? 'Percentage Value (%)'
                        : 'Flat Value (₹ INR)'}{' '}
                      *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={couponFormData.discountType === 'percentage' ? 100 : 100000}
                      required
                      value={couponFormData.discountValue}
                      onChange={(e) =>
                        setCouponFormData((prev) => ({
                          ...prev,
                          discountValue: Number(e.target.value),
                        }))
                      }
                      className="w-full border border-neutral-300 dark:border-neutral-700 px-3.5 py-2.5 text-xs font-mono text-neutral-950 dark:text-white bg-white dark:bg-neutral-900 rounded-xl focus:outline-none focus:border-neutral-950 dark:focus:border-white"
                    />
                  </div>
                </div>

                {/* Target Scope (Global vs Single User) */}
                <div className="space-y-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  <label className="block font-sans text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Target Scope (Who can redeem this coupon?)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCouponFormData((p) => ({ ...p, targetType: 'all', targetValue: '' }))}
                      className={`p-3 rounded-xl border text-xs font-sans font-medium text-center transition-all cursor-pointer ${
                        couponFormData.targetType === 'all'
                          ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                      }`}
                    >
                      <Users className="w-4 h-4 mx-auto mb-1 text-neutral-500" />
                      All Users (Public)
                    </button>

                    <button
                      type="button"
                      onClick={() => setCouponFormData((p) => ({ ...p, targetType: 'user' }))}
                      className={`p-3 rounded-xl border text-xs font-sans font-medium text-center transition-all cursor-pointer ${
                        couponFormData.targetType === 'user'
                          ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                      }`}
                    >
                      <UserCheck className="w-4 h-4 mx-auto mb-1 text-neutral-500" />
                      Specific Username / ID
                    </button>
                  </div>

                  {couponFormData.targetType === 'user' && (
                    <div className="pt-1">
                      <label className="block font-sans text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        Enter Target Username (e.g. @itpiyu) or Email:
                      </label>
                      <input
                        type="text"
                        required
                        value={couponFormData.targetValue}
                        onChange={(e) =>
                          setCouponFormData((prev) => ({ ...prev, targetValue: e.target.value }))
                        }
                        placeholder="@username or user@example.com"
                        className="w-full border border-neutral-300 dark:border-neutral-700 px-3.5 py-2.5 text-xs font-mono text-neutral-950 dark:text-white bg-white dark:bg-neutral-900 rounded-xl focus:outline-none focus:border-neutral-950 dark:focus:border-white"
                      />
                      <p className="text-[11px] text-neutral-400 font-sans mt-1">
                        Locked to this user only. Other users will be rejected at checkout.
                      </p>
                    </div>
                  )}
                </div>

                {/* Single Use Checkbox & Max Total Uses */}
                <div className="space-y-3 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300 font-sans select-none">
                    <input
                      type="checkbox"
                      checked={couponFormData.singleUsePerUser}
                      onChange={(e) =>
                        setCouponFormData((prev) => ({
                          ...prev,
                          singleUsePerUser: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded text-neutral-950 dark:text-white focus:ring-0 cursor-pointer"
                    />
                    <span>Single-use per user (User cannot use it a 2nd time)</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-sans text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Max Total Uses (Optional)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={couponFormData.maxTotalUses}
                        onChange={(e) =>
                          setCouponFormData((prev) => ({
                            ...prev,
                            maxTotalUses: e.target.value,
                          }))
                        }
                        placeholder="Unlimited"
                        className="w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs font-mono text-neutral-950 dark:text-white bg-white dark:bg-neutral-900 rounded-xl focus:outline-none focus:border-neutral-950 dark:focus:border-white"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Expiration Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={couponFormData.expiresAt}
                        onChange={(e) =>
                          setCouponFormData((prev) => ({
                            ...prev,
                            expiresAt: e.target.value,
                          }))
                        }
                        className="w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs font-sans text-neutral-950 dark:text-white bg-white dark:bg-neutral-900 rounded-xl focus:outline-none focus:border-neutral-950 dark:focus:border-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCouponModalOpen(false);
                      setEditingCoupon(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={couponSaving}
                  >
                    {editingCoupon ? 'Update Coupon' : 'Save & Activate Coupon'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create / Edit Product */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-w-2xl w-full p-8 space-y-6 rounded-xl my-8 text-neutral-900 dark:text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <h3 className="font-light text-2xl tracking-[-0.03em] uppercase text-neutral-950 dark:text-white font-sans">
                  {editingApp ? `Edit: ${editingApp.name}` : 'Register New Software'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="font-mono text-sm font-bold text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Product Name"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        slug:
                          !editingApp && !prev.slug
                            ? name
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '')
                            : prev.slug,
                      }));
                    }}
                    placeholder="e.g. Docdril Canvas"
                  />
                  <Input
                    label="Slug (URL Key)"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))
                    }
                    placeholder="e.g. docdril-canvas"
                    disabled={Boolean(editingApp)}
                    helperText={editingApp ? 'Slug cannot be modified once created' : undefined}
                  />
                </div>

                <Input
                  label="Short Description (Summary)"
                  required
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))
                  }
                  placeholder="One sentence overview shown on catalog cards"
                />

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Full Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full border border-neutral-300 dark:border-neutral-800 p-3 text-sm text-neutral-950 dark:text-white bg-white dark:bg-neutral-900/90 focus:outline-none focus:border-neutral-950 dark:focus:border-white rounded-lg font-sans placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    placeholder="Detailed overview of features and capabilities"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, category: e.target.value }))
                      }
                      className="w-full border border-neutral-300 dark:border-neutral-800 px-3 py-2 text-xs font-mono uppercase text-neutral-950 dark:text-white bg-white dark:bg-neutral-900 rounded-lg focus:outline-none focus:border-neutral-950 dark:focus:border-white"
                    >
                      <option value="creative">Creative & Design</option>
                      <option value="animation">Animation & Motion</option>
                      <option value="productivity">Productivity</option>
                      <option value="utilities">Utilities</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as AppStatus,
                        }))
                      }
                      className="w-full border border-neutral-300 dark:border-neutral-800 px-3 py-2 text-xs font-mono uppercase text-neutral-950 dark:text-white bg-white dark:bg-neutral-900 rounded-lg focus:outline-none focus:border-neutral-950 dark:focus:border-white"
                    >
                      <option value="draft">Draft (Internal)</option>
                      <option value="coming_soon">Coming Soon</option>
                      <option value="active">Active (Available)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Visibility
                    </label>
                    <select
                      value={formData.visibility}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          visibility: e.target.value as AppVisibility,
                        }))
                      }
                      className="w-full border border-neutral-300 dark:border-neutral-800 px-3 py-2 text-xs font-mono uppercase text-neutral-950 dark:text-white bg-white dark:bg-neutral-900 rounded-lg focus:outline-none focus:border-neutral-950 dark:focus:border-white"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Application URL"
                    value={formData.applicationUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, applicationUrl: e.target.value }))
                    }
                    placeholder="https://app.docdril.com"
                  />
                  <Input
                    label="Version"
                    value={formData.version}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, version: e.target.value }))
                    }
                    placeholder="1.0.0"
                  />
                </div>

                <Input
                  label="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="Design, Vector, Cloud"
                />

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={formSaving}
                  >
                    {editingApp ? 'Update Product' : 'Register Product'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
