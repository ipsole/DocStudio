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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              PRIVILEGED INTERFACE
            </div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-[-0.03em] uppercase text-white font-sans">
              Product Administration
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-sans">
              Manage software catalog entries, configure launch endpoints, and update lifecycle statuses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleSeedDemoData} className="gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Seed Demo
            </Button>
            <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New Product
            </Button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 border border-red-800/80 bg-red-950/70 text-red-300 font-mono text-xs uppercase tracking-wider flex items-center justify-between rounded-lg">
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
          <div className="p-4 border border-emerald-800/80 bg-emerald-950/70 text-emerald-300 font-mono text-xs uppercase tracking-wider flex items-center gap-2 rounded-lg">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Catalog Table */}
        <div className="border border-neutral-800 bg-neutral-950/80 overflow-hidden rounded-xl shadow-xl text-white">
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-wider font-bold text-white">
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
                <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-300 font-bold uppercase tracking-wider">
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
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-neutral-900/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <span>{app.name}</span>
                        {app.isDemo && (
                          <Badge variant="neutral" size="sm">
                            DEMO
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-neutral-400">{app.slug}</td>
                      <td className="py-3 px-4 uppercase">{app.category}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3 px-4">
                        {app.visibility === 'public' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
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
                            className="text-white underline inline-flex items-center gap-1 hover:text-neutral-300"
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
            <div className="p-16 text-center font-mono text-xs text-neutral-400 uppercase">
              No products found in Firestore. Click &ldquo;New Product&rdquo; or &ldquo;Seed Demo&rdquo; to populate.
            </div>
          )}
        </div>

        {/* Modal: Create / Edit Product */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-neutral-950 border border-neutral-800 max-w-2xl w-full p-8 space-y-6 rounded-xl my-8 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <h3 className="font-light text-2xl tracking-[-0.03em] uppercase text-white font-sans">
                  {editingApp ? `Edit: ${editingApp.name}` : 'Register New Software'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="font-mono text-sm font-bold text-neutral-400 hover:text-white cursor-pointer"
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
                  <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-neutral-300 mb-1.5">
                    Full Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full border border-neutral-800 p-3 text-sm text-white bg-neutral-900/90 focus:outline-none focus:border-white rounded-lg font-sans placeholder:text-neutral-500"
                    placeholder="Detailed overview of features and capabilities"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-neutral-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, category: e.target.value }))
                      }
                      className="w-full border border-neutral-800 px-3 py-2 text-xs font-mono uppercase text-white bg-neutral-900 rounded-lg focus:outline-none focus:border-white"
                    >
                      <option value="creative">Creative & Design</option>
                      <option value="animation">Animation & Motion</option>
                      <option value="productivity">Productivity</option>
                      <option value="utilities">Utilities</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-neutral-300 mb-1.5">
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
                      className="w-full border border-neutral-800 px-3 py-2 text-xs font-mono uppercase text-white bg-neutral-900 rounded-lg focus:outline-none focus:border-white"
                    >
                      <option value="draft">Draft (Internal)</option>
                      <option value="coming_soon">Coming Soon</option>
                      <option value="active">Active (Available)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-neutral-300 mb-1.5">
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
                      className="w-full border border-neutral-800 px-3 py-2 text-xs font-mono uppercase text-white bg-neutral-900 rounded-lg focus:outline-none focus:border-white"
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

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-800">
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
