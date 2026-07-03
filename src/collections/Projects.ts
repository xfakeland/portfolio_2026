import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const folderId = data?.importFromFolder
        if (!folderId) return data

        const existingMedia = Array.isArray(data.media) ? data.media : []
        const existingIds = new Set(
          existingMedia
            .map((m: { file?: unknown }) => {
              const f = m.file
              if (typeof f === 'string' || typeof f === 'number') return f
              if (f && typeof f === 'object' && 'id' in (f as Record<string, unknown>))
                return (f as { id: string | number }).id
              return null
            })
            .filter((x: unknown) => x !== null),
        )

        const { docs } = await req.payload.find({
          collection: 'media',
          where: { folder: { equals: folderId } },
          sort: 'filename',
          limit: 1000,
          depth: 0,
        })

        const toAdd = docs
          .filter((d) => !existingIds.has(d.id))
          .map((d) => {
            const mime = (d as { mimeType?: string }).mimeType || ''
            const kind = mime.startsWith('video/')
              ? 'video'
              : mime.startsWith('audio/')
                ? 'audio'
                : 'image'
            return { kind, file: d.id, colSpan: 1 }
          })

        return {
          ...data,
          media: [...existingMedia, ...toAdd],
          importFromFolder: null,
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value && typeof value === 'string') return slugify(value)
            if (data?.title) return slugify(String(data.title))
            return value
          },
        ],
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'text',
          admin: { width: '50%', placeholder: '2024' },
        },
        {
          name: 'gridColumns',
          type: 'number',
          required: true,
          defaultValue: 5,
          min: 1,
          max: 9,
          admin: {
            width: '50%',
            description: 'Nombre de colonnes de la galerie (1–9).',
          },
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Image affichée dans la grille Work.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'workColSpan',
          type: 'number',
          required: true,
          defaultValue: 6,
          min: 1,
          max: 12,
          admin: {
            width: '50%',
            description: 'Largeur sur la page Work (en colonnes de la grille Work).',
          },
        },
        {
          name: 'workAspectRatio',
          type: 'select',
          required: true,
          defaultValue: '2.2/1',
          options: [
            { label: '2.2:1 (cinéma large)', value: '2.2/1' },
            { label: '16:9', value: '16/9' },
            { label: '3:2', value: '3/2' },
            { label: '4:3', value: '4/3' },
            { label: '1:1 (carré)', value: '1/1' },
            { label: '3:4 (portrait)', value: '3/4' },
            { label: '2:3 (portrait)', value: '2/3' },
          ],
          admin: {
            width: '50%',
            description: 'Ratio de la vignette sur la page Work.',
          },
        },
      ],
    },
    {
      name: 'importFromFolder',
      type: 'relationship',
      relationTo: 'payload-folders',
      admin: {
        description:
          'Sélectionne un dossier puis enregistre : tous ses médias seront ajoutés à la liste ci-dessous (les médias déjà présents sont ignorés). Le champ se vide après import.',
      },
    },
    {
      name: 'importFromFolderCount',
      type: 'ui',
      admin: {
        components: {
          Field: '@/admin/FolderMediaCount#default',
        },
      },
    },
    {
      name: 'media',
      type: 'array',
      labels: { singular: 'Média', plural: 'Médias' },
      admin: {
        description: 'Composition de la page projet, dans l’ordre.',
      },
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'image',
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Vidéo', value: 'video' },
            { label: 'Audio', value: 'audio' },
          ],
        },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'externalUrl',
          type: 'text',
          admin: {
            description: 'Optionnel : URL externe (utile pour gros médias).',
          },
        },
        {
          name: 'colSpan',
          type: 'number',
          min: 1,
          max: 9,
          defaultValue: 1,
          admin: {
            description: 'Largeur en colonnes de la grille du projet.',
          },
        },
        {
          name: 'alt',
          type: 'text',
        },
        {
          name: 'position',
          type: 'ui',
          admin: {
            components: {
              Field: '@/admin/MediaPositionField#default',
            },
          },
        },
      ],
    },
    {
      name: 'mediaBulkDelete',
      type: 'ui',
      admin: {
        components: {
          Field: '@/admin/MediaBulkDelete#default',
        },
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Position dans la page Work (croissant).',
      },
    },
  ],
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}
