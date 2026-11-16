"use client"

import ForecastCard from "@/components/ForecastCard"
import ModelMetrics from "@/components/dashboard/ModelMetrics"
import { PriceHistoryChart } from "@/components/dashboard/MarketCharts"
import { PageHeader } from "@/components/dashboard/PageHeader"

export default function ForecastingPage() {
  return (
    <main className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Price forecasting"
        description="Stacked LSTM, XGBoost and LightGBM models, retrained weekly and run every weekday after settlement."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ForecastCard delay={0} />
        <PriceHistoryChart delay={80} />
        <ModelMetrics delay={160} />
      </div>
    </main>
  )
}
