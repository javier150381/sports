import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck, Smartphone, Trophy } from 'lucide-react'
import { MobileContainer } from '@/components/mobile-container'

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Autenticidad',
    text: 'Valida cada camiseta con un codigo NFC unico, no secuencial y protegido.',
  },
  {
    icon: Smartphone,
    title: 'Experiencia digital',
    text: 'Abre contenido, beneficios, partidos, encuestas y promociones desde el celular.',
  },
  {
    icon: Trophy,
    title: 'Arquitectura flexible',
    text: 'Soporta equipos, competiciones y eventos especiales desde el primer diseno.',
  },
]

export default function HomePage() {
  return (
    <MobileContainer>
      <section className="grid gap-6">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-accent-strong">
            Camisetas deportivas con NFC
          </p>
          <h1 className="text-4xl font-black leading-[0.95] text-white">KUNTUR SPORT</h1>
          <p className="mt-4 text-lg text-silver">
            Mas que una camiseta, una experiencia.
          </p>
          <p className="mt-4 text-sm leading-6 text-muted">
            Plataforma monolitica modular para validar autenticidad, activar camisetas y publicar
            experiencias digitales de equipos ecuatorianos, competiciones y eventos especiales.
          </p>
          <div className="mt-6 grid gap-3">
            <Link
              href="/equipos"
              className="rounded bg-accent px-5 py-3 text-center font-bold text-white transition hover:bg-accent-strong"
            >
              Explorar equipos
            </Link>
            <Link
              href="/nfc/KT-DEMO-A8F4K2"
              className="rounded border border-border px-5 py-3 text-center font-bold text-white transition hover:border-accent"
            >
              Probar NFC demo
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded border border-border bg-black shadow-2xl shadow-black/30">
          <div className="relative aspect-square">
            <Image
              src="/brand/kuntur-sport-logo.png"
              alt="Logo de KUNTUR SPORT con condor andino"
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="border-t border-border bg-panel-strong p-5">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-mono text-sm text-muted">KT-BSC-A8F4K2</span>
              <span className="rounded bg-accent/15 px-3 py-1 text-xs font-bold text-accent-strong">
                DEMO
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted">Estado de autenticidad</p>
                <p className="text-3xl font-black text-white">Camiseta autentica</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded border border-border p-3">
                  <p className="text-muted">Serie</p>
                  <p className="font-mono font-bold">DEMO-0001</p>
                </div>
                <div className="rounded border border-border p-3">
                  <p className="text-muted">Coleccion</p>
                  <p className="font-bold">Ecuador Demo</p>
                </div>
              </div>
              <div className="rounded bg-background p-4">
                <p className="text-sm text-muted">Siguiente paso</p>
                <p className="font-semibold">Activar beneficios exclusivos para propietario NFC.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded border border-border bg-background/70 p-5">
              <pillar.icon className="mb-4 size-7 text-accent-strong" aria-hidden="true" />
              <h2 className="text-lg font-black">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{pillar.text}</p>
            </article>
          ))}
      </section>
    </MobileContainer>
  )
}
