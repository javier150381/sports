import { z } from 'zod'

export const roleSchema = z.enum(['VISITOR', 'FAN', 'EDITOR', 'ADMIN'])

export const authSchema = z.object({
  email: z.string().email('Ingresa un correo valido.'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres.'),
})

export type AuthInput = z.infer<typeof authSchema>
export type Role = z.infer<typeof roleSchema>
