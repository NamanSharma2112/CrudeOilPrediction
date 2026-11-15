"use client"

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { useQuotes, type Quote } from "@/app/hooks/useMarket"
import { DOWN, PanelMessage, UP } from "./Panel"

const ORDER = ["wti", "brent", "natgas", "gasoline", "heating_oil", "dxy", "gold", "spx"]

function fmt(v: number | null, unit: string) {
  if (v == null) return "—"
  const digits = unit === "$/gal" ? 3 : 2
  const n = v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return unit.startsWith("$") ? `$${n}` : n
}

function QuoteCard({ q, index }: { q: Quote; index: number }) {
  const up = (q.change ?? 0) >= 0
  const color = up ? UP : DOWN
  const Arrow = up ? ArrowUpRight : ArrowDownRight
  const spark = q.spark.filter((p) => p.value != null)

  return (
    <div
      className="animate-fade-in-down flex min-w-0 flex-col gap-1 rounded-xl border bg-primary-foreground p-3"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{q.name}</span>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{q.ticker}</span>
      </div>
      <div className="font-mono text-xl font-semibold tabular-nums">{fmt(q.price, q.unit)}</div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-0.5 font-mono text-xs tabular-nums" style={{ color }}>
          <Arrow className="size-3.5" />
          {q.change_pct != null ? `${up ? "+" : ""}${q.change_pct.toFixed(2)}%` : "—"}
        </span>
        <span className="text-[10px] text-muted-foreground">{q.unit}</span>
      </div>
      <div className="h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={spark}>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Line dataKey="value" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function QuoteCards() {
  const { data, isLoading, isError, error, dataUpdatedAt, isFetching } = useQuotes()

  const quotes = ORDER.map((k) => data?.quotes.find((q) => q.key === k)).filter(Boolean) as Quote[]
  const lastPrint = quotes.length ? new Date(Math.max(...quotes.map((q) => +new Date(q.as_of)))) : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live markets
        </span>
        {lastPrint && (
          <span>Last print {lastPrint.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
        )}
        {dataUpdatedAt > 0 && (
          <span>
            Polled {new Date(dataUpdatedAt).toLocaleTimeString()} · {isFetching ? "refreshing…" : "every 60 s"}
          </span>
        )}
        <span className="sm:ml-auto">Source: Yahoo Finance (delayed)</span>
      </div>
      {isLoading && <PanelMessage>Loading live quotes…</PanelMessage>}
      {isError && <PanelMessage error>{error.message}</PanelMessage>}
      {quotes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 2xl:grid-cols-8">
          {quotes.map((q, i) => (
            <QuoteCard key={q.key} q={q} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
