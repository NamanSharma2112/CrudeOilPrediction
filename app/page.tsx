"use client"

import dynamic from "next/dynamic"
import QuoteCards from "@/components/dashboard/QuoteCards"
import { PerformanceChart, PriceHistoryChart, SpreadChart } from "@/components/dashboard/MarketCharts"
import ForecastCard from "@/components/ForecastCard"
import { MapSkeleton } from "meridian-ui"

// The maps draw with canvas/SVG measured in the browser, so skip SSR for them.
const ProductionMap = dynamic(() => import("@/components/dashboard/OilMaps").then((m) => m.ProductionMap), {
  ssr: false,
  loading: () => <MapSkeleton className="lg:col-span-2 2xl:col-span-3" />,
})
const ChokepointGlobe = dynamic(() => import("@/components/dashboard/OilMaps").then((m) => m.ChokepointGlobe), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

export default function Home() {
  return (
    <main className="flex flex-col gap-4 pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Crude oil market overview</h1>
        <p className="text-sm text-muted-foreground">
          Live benchmark prices, ML forecasts, global production and the routes oil travels.
        </p>
      </div>

      <QuoteCards />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <PriceHistoryChart delay={0} />
        <ForecastCard delay={80} />
        <ProductionMap delay={120} />
        <ChokepointGlobe delay={160} />
        <SpreadChart delay={200} />
        <PerformanceChart delay={240} />
      </div>
    </main>
  )
}
