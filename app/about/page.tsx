import type { Metadata } from "next"
import Link from "next/link"
import { REPO_URL } from "@/app/libs/nav"

export const metadata: Metadata = { title: "About & data · CrudeIQ" }

const SOURCES = [
  {
    name: "Yahoo Finance",
    what: "Futures prices for WTI (CL=F), Brent (BZ=F), natural gas, RBOB gasoline, heating oil, plus the US dollar index, gold and the S&P 500.",
    when: "Snapshot every hour on weekdays; delayed exchange data.",
  },
  {
    name: "EIA Open Data",
    what: "Official WTI and Brent spot prices, weekly US crude inventories and rig counts, used as model features when a key is configured.",
    when: "Fetched at each training and forecast run.",
  },
  {
    name: "FRED (St. Louis Fed)",
    what: "10-year Treasury yield, USD/EUR, CPI and unemployment, used as model features when a key is configured.",
    when: "Fetched at each training and forecast run.",
  },
  {
    name: "EIA International Energy Statistics",
    what: "Approximate 2023 production by country shown on the production map.",
    when: "Static reference figures.",
  },
]

const SCHEDULE = [
  ["Market snapshot", "Hourly, Monday–Friday"],
  ["Price forecasts", "22:20 UTC, Monday–Friday, after NYMEX/ICE settlement"],
  ["Model retraining", "Sunday 02:40 UTC"],
]

export default function AboutPage() {
  return (
    <main className="flex max-w-3xl flex-col gap-8 pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">About CrudeIQ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An oil market dashboard with machine-learning price forecasts for WTI and Brent crude.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Data sources</h2>
        <ul className="flex flex-col divide-y rounded-xl border bg-primary-foreground">
          {SOURCES.map((s) => (
            <li key={s.name} className="flex flex-col gap-1 p-4">
              <span className="font-medium">{s.name}</span>
              <span className="text-sm text-muted-foreground">{s.what}</span>
              <span className="text-xs text-muted-foreground">{s.when}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Update schedule</h2>
        <div className="overflow-hidden rounded-xl border bg-primary-foreground">
          <table className="w-full text-sm">
            <tbody>
              {SCHEDULE.map(([job, when]) => (
                <tr key={job} className="border-b last:border-0">
                  <td className="p-3 font-medium">{job}</td>
                  <td className="p-3 text-muted-foreground">{when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          The jobs run on GitHub Actions and publish their results to the repository&apos;s <code>data</code> branch,
          which this site reads.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">The model</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Each forecast comes from three base models (an LSTM network, XGBoost and LightGBM) whose predictions are
          combined by a Ridge regression trained on out-of-fold predictions. Features include recent prices, technical
          indicators (RSI, MACD, Bollinger bands, ATR), calendar effects and, when available, inventory and macro data.
          See current accuracy on the{" "}
          <Link href="/forecasting" className="text-foreground underline underline-offset-2">
            Forecasting
          </Link>{" "}
          page.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
        <h2 className="font-medium">Not investment advice</h2>
        <p className="text-sm text-muted-foreground">
          Prices are delayed and forecasts are experimental. Nothing here is a recommendation to buy or sell anything.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Source code:{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">
          github.com/NamanSharma2112/CrudeOilPrediction
        </a>
      </p>
    </main>
  )
}
