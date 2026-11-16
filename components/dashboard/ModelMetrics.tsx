"use client"

import { useModelLog, type ModelMetrics as Metrics } from "@/app/hooks/useMarket"
import { Panel, PanelMessage } from "./Panel"

const TASK_LABELS: Record<string, string> = {
  wti_close_h1: "WTI · 1 day",
  wti_close_h7: "WTI · 7 days",
  brent_close_h1: "Brent · 1 day",
  brent_close_h7: "Brent · 7 days",
}

const MODELS = ["Stacked(Ridge)", "XGBoost", "LightGBM", "LSTM"]

export default function ModelMetrics({ delay }: { delay?: number }) {
  const { data, isLoading, error } = useModelLog()

  const tasks = data ? Object.entries(data.experiments) : []

  return (
    <Panel
      title="Model accuracy"
      subtitle={
        data
          ? `Held-out test set from the last training run, ${new Date(data.last_retrained_at + "Z").toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}. Lower MAE is better; the best model per task is highlighted.`
          : "Held-out test-set metrics from the last training run"
      }
      className="lg:col-span-full"
      delay={delay}
    >
      {isLoading && <PanelMessage>Loading training log…</PanelMessage>}
      {error && <PanelMessage error>{error.message}</PanelMessage>}
      {tasks.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Task</th>
                <th className="py-2 pr-3 font-medium">Model</th>
                <th className="py-2 pr-3 text-right font-medium">MAE ($)</th>
                <th className="py-2 pr-3 text-right font-medium">RMSE ($)</th>
                <th className="py-2 pr-3 text-right font-medium">MAPE (%)</th>
                <th className="py-2 pr-3 text-right font-medium">R²</th>
                <th className="py-2 text-right font-medium">Direction hit (%)</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(([task, result]) => {
                if ("error" in result) {
                  return (
                    <tr key={task} className="border-b">
                      <td className="py-2 pr-3 font-medium">{TASK_LABELS[task] ?? task}</td>
                      <td colSpan={6} className="py-2 text-destructive">
                        Training failed: {String(result.error)}
                      </td>
                    </tr>
                  )
                }
                const metrics = result as Metrics
                const models = MODELS.filter((m) => metrics[m])
                const best = models.reduce((a, b) => (metrics[a].MAE <= metrics[b].MAE ? a : b))
                return models.map((m, i) => {
                  const r = metrics[m]
                  const isBest = m === best
                  return (
                    <tr
                      key={task + m}
                      className={`${i === models.length - 1 ? "border-b" : ""} ${isBest ? "bg-amber-500/10" : ""}`}
                    >
                      <td className="py-1.5 pr-3 font-medium">{i === 0 ? TASK_LABELS[task] ?? task : ""}</td>
                      <td className="py-1.5 pr-3">
                        {m === "Stacked(Ridge)" ? "Stacked (Ridge)" : m}
                        {isBest && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">best</span>}
                      </td>
                      <td className="py-1.5 pr-3 text-right font-mono tabular-nums">{r.MAE.toFixed(2)}</td>
                      <td className="py-1.5 pr-3 text-right font-mono tabular-nums">{r.RMSE.toFixed(2)}</td>
                      <td className="py-1.5 pr-3 text-right font-mono tabular-nums">{r.MAPE.toFixed(1)}</td>
                      <td className="py-1.5 pr-3 text-right font-mono tabular-nums">{r.R2.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono tabular-nums">{r["Dir Accuracy"].toFixed(0)}</td>
                    </tr>
                  )
                })
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        The 30-day view extends the 7-day model, so it is less reliable than the 7-day figures above suggest.
      </p>
    </Panel>
  )
}
