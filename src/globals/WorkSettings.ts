import type { GlobalConfig } from 'payload'

export const WorkSettings: GlobalConfig = {
  slug: 'work-settings',
  label: 'Page Work',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'gridColumns',
      type: 'number',
      required: true,
      defaultValue: 6,
      min: 1,
      max: 12,
      admin: {
        description: 'Nombre de colonnes de la page Work (1–12).',
      },
    },
  ],
}
