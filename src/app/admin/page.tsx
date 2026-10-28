'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DocApp, AppStatus, AppVisibility } from '@/types';
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
  Boxes,
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<DocApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  useEffect(() => {
    loadAdminApps();
  }, [user]);

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

      setSuccessMsg(editingApp ? 'Product updated successfully.' : 'Product created successfully.');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-blue-100 text-blue-700">
                <Shield className="w-4 h-4" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalog Administration</h1>
            </div>
            <p className="text-xs text-slate-500">
              Manage software catalog entries, configure launch endpoints, and update lifecycle statuses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSeedDemoData} className="gap-1.5 text-xs">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              Seed Demo Products
            </Button>
            <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Register New Product
            </Button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => setError(null)} className="text-xs font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Catalog Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Registered Products ({apps.length})
            </h2>
            <Button variant="ghost" size="sm" onClick={loadAdminApps} className="gap-1.5 text-xs text-slate-500">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading catalog...</div>
          ) : apps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Visibility</th>
                    <th className="py-3 px-4">Launch Endpoint</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <span>{app.name}</span>
                        {app.isDemo && (
                          <Badge variant="neutral" size="sm">
                            Demo
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{app.slug}</td>
                      <td className="py-3 px-4 capitalize">{app.category}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3 px-4">
                        {app.visibility === 'public' ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <Eye className="w-3 h-3 text-emerald-600" />
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            Private
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate">
                        {app.applicationUrl ? (
                          <a
                            href={app.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <span className="truncate">{app.applicationUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">None configured</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(app)}
                          className="gap-1 text-xs"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              No products found in Firestore. Click &ldquo;Register New Product&rdquo; or &ldquo;Seed Demo Products&rdquo; to populate the catalog.
            </div>
          )}
        </div>

        {/* Modal: Create / Edit Product */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-xl my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingApp ? `Edit: ${editingApp.name}` : 'Register New Software Product'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
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
                        // Auto-slug if new product
                        slug: !editingApp && !prev.slug ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug,
                      }));
                    }}
                    placeholder="e.g. Docdril Canvas"
                  />
                  <Input
                    label="Slug (Unique URL identifier)"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                    placeholder="e.g. docdril-canvas"
                    disabled={Boolean(editingApp)}
                    helperText={editingApp ? 'Slug cannot be modified once created' : 'Lowercase, numbers, and hyphens only'}
                  />
                </div>

                <Input
                  label="Short Description (Summary)"
                  required
                  value={formData.shortDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="One sentence overview shown on catalog cards"
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Detailed overview of features and capabilities"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white"
                    >
                      <option value="creative">Creative & Design</option>
                      <option value="animation">Animation & Motion</option>
                      <option value="productivity">Productivity</option>
                      <option value="utilities">Utilities</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Lifecycle Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as AppStatus }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white"
                    >
                      <option value="draft">Draft (Internal)</option>
                      <option value="coming_soon">Coming Soon</option>
                      <option value="active">Active (Available)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Visibility</label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData((prev) => ({ ...prev, visibility: e.target.value as AppVisibility }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private (Restricted)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Application URL"
                    value={formData.applicationUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, applicationUrl: e.target.value }))}
                    placeholder="https://app.docdril.com or relative route"
                    helperText="URL to launch the live application"
                  />
                  <Input
                    label="Version"
                    value={formData.version}
                    onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                    placeholder="1.0.0"
                  />
                </div>

                <Input
                  label="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="Design, Vector, Cloud"
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
