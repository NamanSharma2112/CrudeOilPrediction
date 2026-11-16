"use client"

import "meridian-ui/styles.css"
import { useMemo, useState } from "react"
import { Globe, MapLegend, RankingBars, WorldMap, type MapMarker } from "meridian-ui"
import { useIsMobile } from "@/hooks/use-mobile"
import { GLOBAL_CHOKEPOINTS } from "@/app/libs/constants"
import { PRODUCTION_MBD, PRODUCTION_SHORT_NAMES } from "@/app/libs/oil-data"
import { Panel, Segmented } from "./Panel"

const RAMP = ["#FDE68A", "#FBBF24", "#F59E0B", "#D97706", "#B45309", "#78350F"]
const CHOKE_COLOR = "#EF4444"

const chokepointMarkers: MapMarker[] = GLOBAL_CHOKEPOINTS.map((c) => ({
  id: c.id,
  lat: c.coordinates[1],
  lng: c.coordinates[0],
  label: c.name,
  description: `${c.volumeMbd} mb/d transit · ${c.description}`,
  color: CHOKE_COLOR,
  shape: "diamond",
  size: 4,
}))

const shortName = (n: string) => PRODUCTION_SHORT_NAMES[n] ?? n
const fullName = Object.fromEntries(Object.keys(PRODUCTION_MBD).map((n) => [shortName(n), n]))
const fmtMbd = (v: number) => `${v.toFixed(1)} mb/d`

const LAYERS = ["Production", "Chokepoints"] as const
type Layer = (typeof LAYERS)[number]

// ---------------------------------------------------------------------------
// World map: production choropleth + trade routes + chokepoints, linked ranking
// ---------------------------------------------------------------------------

export function ProductionMap({ delay, initialLayer = "Production" }: { delay?: number; initialLayer?: Layer }) {
  const [layer, setLayer] = useState<Layer>(initialLayer)
  const [hovered, setHovered] = useState<string | null>(null)
  // On phones the in-map legend covers most of the map; render it below instead.
  const isMobile = useIsMobile()
  const values = Object.values(PRODUCTION_MBD)

  const ranking = useMemo(
    () => Object.entries(PRODUCTION_MBD).map(([name, value]) => ({ label: shortName(name), value })),
    []
  )
  const total = ranking.reduce((s, r) => s + r.value, 0)

  return (
    <Panel
      title="Global oil production"
      subtitle="Total petroleum liquids by country (approx. 2023, EIA) and the maritime chokepoints oil passes through"
      actions={<Segmented options={LAYERS} value={layer} onChange={setLayer} />}
      className="lg:col-span-full"
      delay={delay}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <WorldMap
            variant={layer === "Production" ? "solid" : "dots"}
            data={layer === "Production" ? PRODUCTION_MBD : undefined}
            colors={RAMP}
            valueLabel="Production"
            formatValue={fmtMbd}
            legend={layer === "Production" && !isMobile ? "Million barrels / day" : false}
            markers={layer !== "Production" ? chokepointMarkers : []}
            selected={hovered ? fullName[hovered] ?? hovered : null}
            onRegionHover={(r) => setHovered(r && PRODUCTION_MBD[r.name] ? shortName(r.name) : null)}
            zoomable
            aria-label="World map of oil production and chokepoints"
          />
          {layer === "Production" && isMobile && (
            <MapLegend
              title="Million barrels / day"
              colors={RAMP}
              min={Math.min(...values)}
              max={Math.max(...values)}
              format={fmtMbd}
              className="mt-2"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          {layer === "Production" && (
            <>
              <RankingBars
                data={ranking}
                limit={12}
                title="Top producers"
                format={fmtMbd}
                highlight={hovered}
                onHover={setHovered}
              />
              <p className="text-xs text-muted-foreground">
                Shown countries total ≈ {total.toFixed(0)} mb/d of ~102 mb/d world supply.
              </p>
            </>
          )}
          {layer === "Chokepoints" && <ChokepointList />}
        </div>
      </div>
    </Panel>
  )
}

function ChokepointList() {
  const max = Math.max(...GLOBAL_CHOKEPOINTS.map((c) => c.volumeMbd))
  return (
    <ul className="flex flex-col gap-3">
      {GLOBAL_CHOKEPOINTS.map((c) => (
        <li key={c.id} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 truncate">
              <span className="size-2 shrink-0 rotate-45" style={{ background: CHOKE_COLOR }} />
              {c.name}
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums">{c.volumeMbd} mb/d</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${(c.volumeMbd / max) * 100}%`, background: CHOKE_COLOR }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Live globe: real-time day/night terminator, chokepoints and tanker routes
// ---------------------------------------------------------------------------

export function ChokepointGlobe({ delay }: { delay?: number }) {
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null)

  return (
    <Panel
      title="Chokepoint watch"
      subtitle="Live day/night shading follows the real sun position. Click a strait to fly there."
      delay={delay}
    >
      <div className="mx-auto w-full max-w-[340px]">
        <Globe
          variant="dots"
          markers={chokepointMarkers}
          terminator
          autoRotate={focus ? 0 : 6}
          initialView={{ lat: 20, lng: 55 }}
          focus={focus}
          aria-label="Globe showing oil chokepoints and trade routes"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {GLOBAL_CHOKEPOINTS.map((c) => (
          <button
            key={c.id}
            onClick={() => setFocus({ lat: c.coordinates[1], lng: c.coordinates[0] })}
            className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-red-500 hover:text-foreground"
          >
            {c.name.replace(" & SUMED", "")} · {c.volumeMbd}
          </button>
        ))}
        {focus && (
          <button onClick={() => setFocus(null)} className="rounded-full px-2 py-0.5 text-xs underline">
            Resume rotation
          </button>
        )}
      </div>
    </Panel>
  )
}
