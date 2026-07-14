import { cn } from '@/lib/utils'

type MobileContainerProps = {
  children: React.ReactNode
  className?: string
}

export function MobileContainer({ children, className }: MobileContainerProps) {
  return (
    <main
      className={cn(
        'mx-auto min-h-[calc(100vh-69px)] w-full max-w-[430px] border-x border-border/70 bg-background/55 px-4 py-6 shadow-2xl shadow-black/25 sm:my-4 sm:min-h-[calc(100vh-101px)] sm:rounded sm:border',
        className,
      )}
    >
      {children}
    </main>
  )
}
