'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { loginAction, registerAction } from '@/server/auth/actions'
import { authSchema, type AuthInput } from '@/server/auth/schemas'

type AuthFormProps = {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthInput>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = (values: AuthInput) => {
    setMessage(null)
    startTransition(async () => {
      const result = mode === 'login' ? await loginAction(values) : await registerAction(values)
      if (!result.success) {
        setMessage(result.error.message)
      }
    })
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <label className="grid gap-2 text-sm font-semibold">
        Correo electronico
        <input
          {...register('email')}
          className="rounded border border-border bg-background px-3 py-3 text-white outline-none focus:border-accent"
          type="email"
          autoComplete="email"
        />
        {errors.email ? <span className="text-xs text-accent-strong">{errors.email.message}</span> : null}
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Contrasena
        <input
          {...register('password')}
          className="rounded border border-border bg-background px-3 py-3 text-white outline-none focus:border-accent"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
        {errors.password ? (
          <span className="text-xs text-accent-strong">{errors.password.message}</span>
        ) : null}
      </label>
      {message ? (
        <p className="rounded border border-accent/50 bg-accent/10 px-3 py-2 text-sm text-accent-strong">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-accent px-4 py-3 font-black text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
      </button>
    </form>
  )
}
