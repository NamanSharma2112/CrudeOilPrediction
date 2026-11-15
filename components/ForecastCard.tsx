"use client"

import { useState } from "react"
import { Area, ComposedChart, CartesianGrid, Line, XAxis, YAxis } from "recharts"
import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { useForecast } from "@/app/hooks/useForecast"
import type { ForecastParams } from "@/app/libs/api"
import { Panel, PanelMessage, Segmented } from "@/components/dashboard/Panel"

const chartConfig = {
  forecast: { label: "Forecast", color: "#F59E0B" },
  band: { label: "Confidence band", color: "#F59E0B" },
} satisfies ChartConfig

const DIRECTION = {
  bullish: { Icon: TrendingUp, color: "#10B981" },
  bearish: { Icon: TrendingDown, color: "#EF4444" },
  neutral: { Icon: Minus, color: "currentColor" },
}

export default function ForecastCard({ delay }: { delay?: number }) {
  const [symbol, setSymbol] = useState<ForecastParams["symbol"]>("wti")
  const [horizon, setHorizon] = useState<ForecastParams["horizon"]>(7)
  const { data, isLoading, isError, error } = useForecast({ symbol, horizon })

  const chartData =
    data?.forecast.map((v, i) => ({
      day: `D+${i + 1}`,
      forecast: v,
      band: [data.lower_ci[i], data.upper_ci[i]] as [number, number],
    })) ?? []
  const dir = DIRECTION[data?.direction ?? "neutral"]

  return (
    <Panel
      title="ML price forecast"
      subtitle="Stacked LSTM + XGBoost + LightGBM, Ridge meta-learner"
      delay={delay}
      actions={
        <>
          <Segmented options={["wti", "brent"] as const} value={symbol} onChange={setSymbol} format={(s) => s.toUpperCase()} />
          <Segmented options={[7, 30] as const} value={horizon} onChange={setHorizon} format={(h) => `${h}D`} />
        </>
      }
    >
      {isLoading && <PanelMessage>Running model…</PanelMessage>}
      {isError && <PanelMessage error>{error.message}</PanelMessage>}

      {data && (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-3xl font-semibold tabular-nums">${data.forecast.at(-1)?.toFixed(2)}</span>
            <Badge variant="secondary" className="gap-1 capitalize" style={{ color: dir.color }}>
              <dir.Icon className="size-3" /> {data.direction}
            </Badge>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            {symbol.toUpperCase()} in {data.horizon} days · model confidence {(data.confidence * 100).toFixed(0)}%
          </p>
          <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
            <ComposedChart data={chartData} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
              <YAxis tickLine={false} axisLine={false} domain={["auto", "auto"]} width={44} tickFormatter={(v) => `$${v}`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="band" stroke="none" fill="var(--color-band)" fillOpacity={0.15} />
              <Line dataKey="forecast" stroke="var(--color-forecast)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ChartContainer>
          <p className="text-xs text-muted-foreground">Model version {data.model_version}</p>
        </>
      )}
    </Panel>
  )
}
