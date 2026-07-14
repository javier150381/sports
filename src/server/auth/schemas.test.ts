import { describe, expect, it } from 'vitest'
import { authSchema, roleSchema } from './schemas'

describe('auth schemas', () => {
  it('accepts valid auth input', () => {
    expect(authSchema.safeParse({ email: 'fan@kuntur.test', password: 'supersegura' }).success).toBe(
      true,
    )
  })

  it('rejects short passwords', () => {
    expect(authSchema.safeParse({ email: 'fan@kuntur.test', password: '123' }).success).toBe(false)
  })

  it('limits roles to supported values', () => {
    expect(roleSchema.safeParse('ADMIN').success).toBe(true)
    expect(roleSchema.safeParse('OWNER').success).toBe(false)
  })
})
