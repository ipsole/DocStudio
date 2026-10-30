import { DocApp } from '@/types';

/**
 * Demonstration catalog records for development and testing.
 * Every record is explicitly marked with `isDemo: true` to prevent confusing
 * demonstration data with future production products.
 */
export const DEMO_APPS: DocApp[] = [
  {
    id: 'demo-canvas',
    slug: 'docdril-canvas',
    name: 'Docdril Canvas',
    shortDescription: 'Visual canvas & layout tool for designing modern assets and diagrams.',
    description: 'Docdril Canvas is a visual workspace designed for creative workflows. Build custom graphics, diagrams, and digital assets with intuitive vector controls, reusable components, and real-time collaboration.',
    category: 'creative',
    icon: 'Palette',
    status: 'active',
    visibility: 'public',
    applicationUrl: 'https://demo-canvas.docdril.com',
    featured: true,
    version: '0.9.0-beta',
    tags: ['Design', 'Vector', 'Creative'],
    isDemo: true,
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'demo-motion',
    slug: 'docdril-motion',
    name: 'Docdril Motion',
    shortDescription: 'Slideshow and text animation engine for dynamic presentations.',
    description: 'Transform static slides and typography into kinetic motion sequences. Export to web formats, video, or embed directly into web apps with zero configuration.',
    category: 'animation',
    icon: 'Clapperboard',
    status: 'coming_soon',
    visibility: 'public',
    applicationUrl: null,
    featured: true,
    version: '0.1.0-alpha',
    tags: ['Animation', 'Typography', 'Video'],
    isDemo: true,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'demo-flow',
    slug: 'docdril-flow',
    name: 'Docdril Flow',
    shortDescription: 'Productivity and workflow automation utility for document pipelines.',
    description: 'Automate repetitive document conversions, transformations, and asset packaging across your team. Connects seamlessly with DocStore shared accounts.',
    category: 'productivity',
    icon: 'Layers',
    status: 'active',
    visibility: 'public',
    applicationUrl: 'https://demo-flow.docdril.com',
    featured: false,
    version: '1.0.0',
    tags: ['Productivity', 'Automation', 'Documents'],
    isDemo: true,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'demo-draft-internal',
    slug: 'docdril-internal-draft',
    name: 'Internal Draft Utility (Demo)',
    shortDescription: 'Internal staging tool not visible to the public catalog.',
    description: 'This draft item illustrates lifecycle status handling. It should only be visible to administrators.',
    category: 'utilities',
    icon: 'Wrench',
    status: 'draft',
    visibility: 'private',
    applicationUrl: null,
    featured: false,
    version: '0.0.1',
    tags: ['Internal'],
    isDemo: true,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 10,
  }
];

export const CATEGORIES = [
  { id: 'all', label: 'All Software' },
  { id: 'creative', label: 'Creative & Design' },
  { id: 'animation', label: 'Animation & Motion' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'utilities', label: 'Utilities' },
];
