import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/*', 'video/*', 'audio/*'],
    formatOptions: {
      format: 'webp',
      options: { lossless: true, effort: 6 },
    },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 600,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 90, effort: 6 } },
      },
      {
        name: 'card',
        width: 1280,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 92, effort: 6 } },
      },
      {
        name: 'feature',
        width: 2400,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 94, effort: 6 } },
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
}
