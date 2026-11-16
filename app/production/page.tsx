"use client"

import { ProductionMap } from "@/components/dashboard/Maps"
import { PageHeader } from "@/components/dashboard/PageHeader"

export default function ProductionPage() {
  return (
    <main className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Production"
        description="Total petroleum liquids output by country. Hover a country or a bar to compare."
      />
      <div className="grid grid-cols-1 gap-4">
        <ProductionMap delay={0} initialLayer="Production" />
      </div>
    </main>
  )
}
