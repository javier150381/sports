import Link from 'next/link'
import { MobileContainer } from '@/components/mobile-container'
import { AuthForm } from '@/features/auth/auth-form'

export default function LoginPage() {
  return (
    <MobileContainer className="grid content-center">
      <div className="rounded border border-border bg-panel/80 p-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-strong">
          Acceso
        </p>
        <h1 className="mt-2 text-3xl font-black">Inicia sesion</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Entra para activar camisetas, votar y consultar tus beneficios.
        </p>
        <AuthForm mode="login" />
        <p className="mt-5 text-sm text-muted">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-bold text-white underline decoration-accent">
            Registrate
          </Link>
        </p>
      </div>
    </MobileContainer>
  )
}
