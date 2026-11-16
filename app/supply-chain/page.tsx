"use client"

import { ChokepointGlobe, TankerMap } from "@/components/dashboard/Maps"
import { SpreadChart } from "@/components/dashboard/MarketCharts"
import { PageHeader } from "@/components/dashboard/PageHeader"

export default function SupplyChainPage() {
  return (
    <main className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Supply chain"
        description="Where tankers carry crude by sea, the straits they pass through, and the Atlantic-basin price gap. Pick a region for a detailed view."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TankerMap delay={0} />
        <ChokepointGlobe delay={80} />
        <SpreadChart delay={160} />
      </div>
    </main>
  )
}
