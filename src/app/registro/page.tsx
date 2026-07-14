import Link from 'next/link'
import { MobileContainer } from '@/components/mobile-container'
import { AuthForm } from '@/features/auth/auth-form'

export default function RegisterPage() {
  return (
    <MobileContainer className="grid content-center">
      <div className="rounded border border-border bg-panel/80 p-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-strong">
          Hincha NFC
        </p>
        <h1 className="mt-2 text-3xl font-black">Crea tu cuenta</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Registra tu perfil para activar camisetas y participar en experiencias exclusivas.
        </p>
        <AuthForm mode="register" />
        <p className="mt-5 text-sm text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-bold text-white underline decoration-accent">
            Inicia sesion
          </Link>
        </p>
      </div>
    </MobileContainer>
  )
}
