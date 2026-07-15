import { z } from 'zod'

const teamBaseSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio.'),
  short_name: z.string().min(2).max(8).or(z.literal('')).optional(),
  description: z.string().or(z.literal('')).optional(),
  logo_url: z.string().url('Ingresa una URL valida.').or(z.literal('')).optional(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Usa formato hexadecimal.'),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Usa formato hexadecimal.'),
  external_api_id: z.string().or(z.literal('')).optional(),
  active: z.boolean(),
})

export const teamCreateSchema = teamBaseSchema

export const teamUpdateSchema = teamBaseSchema.extend({
  id: z.string().uuid(),
})

export type TeamCreateInput = z.infer<typeof teamCreateSchema>
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>
