import { cn } from "@/lib/utils"

export function Panel({
  title,
  subtitle,
  actions,
  className,
  children,
  delay = 0,
}: {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <section
      className={cn(
        "animate-fade-in-down flex min-w-0 flex-col gap-4 rounded-xl border bg-primary-foreground p-4",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-medium leading-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-1">{actions}</div>}
      </header>
      {children}
    </section>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  format = (v) => String(v),
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  format?: (v: T) => string
}) {
  return (
    <div className="inline-flex rounded-md border p-0.5">
      {options.map((o) => (
        <button
          key={String(o)}
          onClick={() => onChange(o)}
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
            o === value && "bg-foreground text-background hover:text-background"
          )}
        >
          {format(o)}
        </button>
      ))}
    </div>
  )
}

export function PanelMessage({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm",
        error ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {children}
    </div>
  )
}

export const SERIES_COLORS = {
  wti: "#F59E0B",
  brent: "#38BDF8",
  spread: "#A78BFA",
  natgas: "#2DD4BF",
  dxy: "#A78BFA",
  gold: "#FACC15",
  spx: "#F472B6",
} as const

export const UP = "#10B981"
export const DOWN = "#EF4444"
