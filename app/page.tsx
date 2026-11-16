"use client"

import QuoteCards from "@/components/dashboard/QuoteCards"
import { PerformanceChart, PriceHistoryChart, SpreadChart } from "@/components/dashboard/MarketCharts"
import { ChokepointGlobe, ProductionMap, TankerMap } from "@/components/dashboard/Maps"
import { PageHeader } from "@/components/dashboard/PageHeader"
import ForecastCard from "@/components/ForecastCard"

export default function Overview() {
  return (
    <main className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Crude oil market overview"
        description="Live benchmark prices, ML forecasts, global production and the routes oil travels."
      />
      <QuoteCards />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PriceHistoryChart delay={0} />
        <ForecastCard delay={80} />
        <TankerMap delay={120} />
        <ProductionMap delay={140} />
        <ChokepointGlobe delay={160} />
        <SpreadChart delay={200} />
        <PerformanceChart delay={240} />
      </div>
    </main>
  )
}
