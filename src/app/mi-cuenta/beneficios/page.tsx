import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/session'

export default async function AccountBenefitsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black">Beneficios</h1>
      <p className="mt-3 text-muted">Puntos, cupones y beneficios exclusivos para propietarios NFC.</p>
    </main>
  )
}
