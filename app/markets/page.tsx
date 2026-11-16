"use client"

import QuoteCards from "@/components/dashboard/QuoteCards"
import { PerformanceChart, PriceHistoryChart, SpreadChart } from "@/components/dashboard/MarketCharts"
import { PageHeader } from "@/components/dashboard/PageHeader"

export default function MarketsPage() {
  return (
    <main className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Markets"
        description="Crude benchmarks, refined products and the markets that move with oil."
      />
      <QuoteCards />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PriceHistoryChart delay={0} />
        <SpreadChart delay={80} />
        <PerformanceChart delay={160} />
      </div>
    </main>
  )
}
