import { MobileContainer } from '@/components/mobile-container'

type NfcPageProps = {
  params: Promise<{ code: string }>
}

export default async function NfcPage({ params }: NfcPageProps) {
  const { code } = await params

  return (
    <MobileContainer>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-strong">
        Validacion NFC
      </p>
      <h1 className="mt-2 text-3xl font-black">Codigo {code}</h1>
      <div className="mt-6 rounded border border-border bg-panel p-5">
        <p className="text-muted">
          La validacion contra Supabase y la activacion atomica se implementan en Fase 2.
        </p>
      </div>
    </MobileContainer>
  )
}
