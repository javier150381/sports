import { redirect } from 'next/navigation'
import { MobileContainer } from '@/components/mobile-container'
import { getCurrentUser } from '@/server/auth/session'

export default async function AccountPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <MobileContainer>
      <h1 className="text-3xl font-black">Mi cuenta</h1>
      <p className="mt-3 text-muted">Tus camisetas, puntos, pronosticos y beneficios NFC.</p>
      <section className="mt-6 grid gap-4">
        {['Camisetas activadas', 'Pronosticos', 'Beneficios'].map((item) => (
          <div key={item} className="rounded border border-border bg-panel p-5">
            <h2 className="font-black">{item}</h2>
            <p className="mt-2 text-sm text-muted">Modulo listo para la siguiente fase.</p>
          </div>
        ))}
      </section>
    </MobileContainer>
  )
}
