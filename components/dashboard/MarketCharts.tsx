"use client"

import { useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useHistory, type HistoryRange, type HistoryRow } from "@/app/hooks/useMarket"
import { Panel, PanelMessage, Segmented, SERIES_COLORS } from "./Panel"

const RANGES = ["1M", "3M", "6M", "1Y", "5Y"] as const

function tickDate(range: HistoryRange) {
  return (v: string) => {
    const d = new Date(v + "T00:00:00")
    return range === "5Y" || range === "1Y"
      ? d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
}

function useRangeHistory(initial: HistoryRange) {
  const [range, setRange] = useState<HistoryRange>(initial)
  const q = useHistory(range)
  const picker = <Segmented options={RANGES} value={range} onChange={setRange} />
  return { range, picker, ...q }
}

function Status({ isLoading, error }: { isLoading: boolean; error: Error | null }) {
  if (isLoading) return <PanelMessage>Loading price history…</PanelMessage>
  if (error) return <PanelMessage error>{error.message}</PanelMessage>
  return null
}

// ---------------------------------------------------------------------------
// WTI vs Brent price history
// ---------------------------------------------------------------------------

const priceConfig = {
  wti: { label: "WTI", color: SERIES_COLORS.wti },
  brent: { label: "Brent", color: SERIES_COLORS.brent },
} satisfies ChartConfig

export function PriceHistoryChart({ delay }: { delay?: number }) {
  const { range, picker, data, isLoading, error } = useRangeHistory("1Y")
  const rows = data?.rows ?? []
  const last = rows.at(-1)
  const first = rows[0]
  const chg = (k: "wti" | "brent") =>
    last?.[k] != null && first?.[k] ? ((last[k]! - first[k]!) / first[k]!) * 100 : null

  return (
    <Panel
      title="Crude benchmarks · WTI vs Brent"
      subtitle="Daily front-month futures settlements, $/bbl"
      actions={picker}
      className="lg:col-span-2"
      delay={delay}
    >
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {(["wti", "brent"] as const).map((k) => {
            const c = chg(k)
            return (
              <div key={k}>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ background: SERIES_COLORS[k] }} />
                  {priceConfig[k].label}
                </div>
                <div className="font-mono text-2xl font-semibold tabular-nums">${last?.[k]?.toFixed(2)}</div>
                {c != null && (
                  <div className="font-mono text-xs" style={{ color: c >= 0 ? "#10B981" : "#EF4444" }}>
                    {c >= 0 ? "+" : ""}
                    {c.toFixed(1)}% over {range}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <Status isLoading={isLoading} error={error} />
      {rows.length > 0 && (
        <ChartContainer config={priceConfig} className="aspect-auto h-[280px] w-full">
          <AreaChart data={rows} margin={{ left: 0, right: 8 }}>
            <defs>
              {(["wti", "brent"] as const).map((k) => (
                <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} tickFormatter={tickDate(range)} />
            <YAxis tickLine={false} axisLine={false} width={40} domain={["auto", "auto"]} tickFormatter={(v) => `$${v}`} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Area dataKey="brent" type="monotone" stroke="var(--color-brent)" fill="url(#fill-brent)" strokeWidth={2} />
            <Area dataKey="wti" type="monotone" stroke="var(--color-wti)" fill="url(#fill-wti)" strokeWidth={2} />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      )}
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Brent–WTI spread
// ---------------------------------------------------------------------------

const spreadConfig = { spread: { label: "Brent − WTI", color: SERIES_COLORS.spread } } satisfies ChartConfig

export function SpreadChart({ delay }: { delay?: number }) {
  const { range, picker, data, isLoading, error } = useRangeHistory("6M")
  const rows = (data?.rows ?? []).filter((r) => r.spread != null)
  const avg = rows.length ? rows.reduce((s, r) => s + r.spread!, 0) / rows.length : null
  const last = rows.at(-1)?.spread

  return (
    <Panel
      title="Brent–WTI spread"
      subtitle={
        last != null && avg != null
          ? `Now $${last.toFixed(2)} · ${range} average $${avg.toFixed(2)}`
          : "Atlantic-basin arbitrage, $/bbl"
      }
      actions={picker}
      delay={delay}
    >
      <Status isLoading={isLoading} error={error} />
      {rows.length > 0 && (
        <ChartContainer config={spreadConfig} className="aspect-auto h-[220px] w-full">
          <AreaChart data={rows} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} tickFormatter={tickDate(range)} />
            <YAxis tickLine={false} axisLine={false} width={36} domain={["auto", "auto"]} tickFormatter={(v) => `$${v}`} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            {avg != null && <ReferenceLine y={avg} stroke="currentColor" strokeOpacity={0.4} strokeDasharray="4 4" />}
            <Area dataKey="spread" type="monotone" stroke="var(--color-spread)" fill="var(--color-spread)" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      )}
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Cross-asset performance, rebased to 100
// ---------------------------------------------------------------------------

const PERF_KEYS = ["wti", "brent", "natgas", "dxy", "gold", "spx"] as const
const perfConfig = {
  wti: { label: "WTI", color: SERIES_COLORS.wti },
  brent: { label: "Brent", color: SERIES_COLORS.brent },
  natgas: { label: "Nat gas", color: SERIES_COLORS.natgas },
  dxy: { label: "USD index", color: SERIES_COLORS.dxy },
  gold: { label: "Gold", color: SERIES_COLORS.gold },
  spx: { label: "S&P 500", color: SERIES_COLORS.spx },
} satisfies ChartConfig

function rebase(rows: HistoryRow[]) {
  const base: Partial<Record<(typeof PERF_KEYS)[number], number>> = {}
  for (const k of PERF_KEYS) base[k] = rows.find((r) => r[k] != null)?.[k] ?? undefined
  return rows.map((r) => {
    const out: Record<string, number | string | null> = { date: r.date }
    for (const k of PERF_KEYS) {
      const b = base[k]
      out[k] = r[k] != null && b ? +((r[k]! / b) * 100).toFixed(2) : null
    }
    return out
  })
}

export function PerformanceChart({ delay }: { delay?: number }) {
  const { range, picker, data, isLoading, error } = useRangeHistory("1Y")
  const rows = useMemo(() => rebase(data?.rows ?? []), [data])

  return (
    <Panel
      title="Cross-asset performance"
      subtitle={`Rebased to 100 at the start of the ${range} window`}
      actions={picker}
      delay={delay}
    >
      <Status isLoading={isLoading} error={error} />
      {rows.length > 0 && (
        <ChartContainer config={perfConfig} className="aspect-auto h-[260px] w-full">
          <LineChart data={rows} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} tickFormatter={tickDate(range)} />
            <YAxis tickLine={false} axisLine={false} width={32} domain={["auto", "auto"]} />
            <ReferenceLine y={100} stroke="currentColor" strokeOpacity={0.4} strokeDasharray="4 4" />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            {PERF_KEYS.map((k) => (
              <Line key={k} dataKey={k} type="monotone" stroke={`var(--color-${k})`} strokeWidth={k === "wti" || k === "brent" ? 2 : 1.5} dot={false} />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      )}
    </Panel>
  )
}
