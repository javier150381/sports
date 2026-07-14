import type { Metadata } from 'next'
import type { Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'KUNTUR SPORT',
  description: 'Mas que una camiseta, una experiencia.',
}

const navItems: Array<{ href: Route; label: string }> = [
  { href: '/equipos', label: 'Equipos' },
  { href: '/competiciones', label: 'Competiciones' },
  { href: '/mi-cuenta', label: 'Mi cuenta' },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3" aria-label="KUNTUR SPORT">
              <span className="relative size-11 overflow-hidden rounded border border-border bg-black">
                <Image
                  src="/brand/kuntur-sport-logo.png"
                  alt="Logo de KUNTUR SPORT"
                  fill
                  sizes="44px"
                  className="object-cover"
                  priority
                />
              </span>
              <span>
                <span className="block text-sm font-black tracking-wide">KUNTUR SPORT</span>
                <span className="block text-xs text-muted">Experiencias NFC</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-5 text-sm text-muted sm:flex">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-foreground">
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/login"
              className="rounded border border-border px-3 py-2 text-sm font-semibold transition hover:border-accent hover:text-white"
            >
              Ingresar
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
