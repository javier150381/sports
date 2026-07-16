import { z } from 'zod'

export const contentTypeSchema = z.enum([
  'NEWS',
  'VIDEO',
  'TEAM_CHANT',
  'GOAL_VIDEO',
  'HIGHLIGHT',
  'HISTORIC_MOMENT',
  'IMAGE',
  'PROMOTION',
  'LIVE_STREAM',
  'WALLPAPER',
  'ANNOUNCEMENT',
  'WEB_EMBED',
])

export const contentStatusSchema = z.enum([
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED',
])

const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.string().url('Ingresa una URL valida.').or(z.literal('')).optional(),
)

export const contentPostInputSchema = z.object({
  title: z.string().min(3, 'El titulo es obligatorio.'),
  description: z.string().optional(),
  content_type: contentTypeSchema,
  external_url: optionalUrlSchema,
  image_url: optionalUrlSchema,
  alt_text: z.string().optional(),
  team_id: z.string().uuid().or(z.literal('')).optional(),
  status: contentStatusSchema,
  is_featured: z.boolean(),
  nfc_exclusive: z.boolean(),
  display_order: z.coerce.number().int().min(0),
})

export type ContentPostInput = z.infer<typeof contentPostInputSchema>
