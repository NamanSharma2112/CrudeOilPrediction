"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { geoMercator, geoPath, type GeoProjection } from "d3-geo"
import { getCountryRegions } from "meridian-ui"
import { Minus, Plus, RotateCcw } from "lucide-react"
import { MAP_VIEWS, SEA_ROUTES, type LngLat, type SeaRoute } from "@/app/libs/sea-routes"
import { GLOBAL_CHOKEPOINTS } from "@/app/libs/constants"
import { useTankers, type Tanker } from "@/app/hooks/useMarket"
import { Panel } from "./Panel"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

const BASE_WIDTH = 1000 // projection is built once at this width; zoom is a transform
const SHIP_SPEED = 9 // base-map px per second at zoom 1
const SHIP_COLOR = "#F59E0B"
const LIVE_COLOR = "#10B981"
const CHOKE_COLOR = "#EF4444"

type Transform = { k: number; x: number; y: number }

interface ProjectedRoute {
  route: SeaRoute
  pts: [number, number][]
  cum: number[] // cumulative length at each point
  length: number
  ships: number
  d: string
}

function makeProjection(): GeoProjection {
  const [w, s, e, n] = MAP_VIEWS[0].bounds
  return geoMercator().fitWidth(BASE_WIDTH, {
    type: "MultiPoint",
    coordinates: [[w, s], [e, n]],
  })
}

function projectRoute(projection: GeoProjection, route: SeaRoute): ProjectedRoute {
  // Densify each leg so long ocean crossings curve like real great-circle tracks.
  const dense: LngLat[] = []
  route.points.forEach((p, i) => {
    if (i === 0) return dense.push(p)
    const a = route.points[i - 1]
    const steps = Math.max(1, Math.ceil(Math.hypot(p[0] - a[0], p[1] - a[1]) / 2))
    for (let s = 1; s <= steps; s++) dense.push([a[0] + ((p[0] - a[0]) * s) / steps, a[1] + ((p[1] - a[1]) * s) / steps])
  })
  const pts = dense.map((p) => projection(p) as [number, number])
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return {
    route,
    pts,
    cum,
    length: cum[cum.length - 1],
    ships: Math.max(2, Math.round(route.mbd * 3)),
    d: "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join("L"),
  }
}

/** Position and heading (degrees) at distance `dist` along a projected route. */
function pointAt(r: ProjectedRoute, dist: number): [number, number, number] {
  let lo = 0
  let hi = r.cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (r.cum[mid] <= dist) lo = mid
    else hi = mid
  }
  const [x0, y0] = r.pts[lo]
  const [x1, y1] = r.pts[hi]
  const seg = r.cum[hi] - r.cum[lo] || 1
  const t = (dist - r.cum[lo]) / seg
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI]
}

function viewTransform(projection: GeoProjection, bounds: number[], width: number, height: number): Transform {
  const [w, s, e, n] = bounds
  const [x0, y1] = projection([w, s])!
  const [x1, y0] = projection([e, n])!
  const k = Math.min(width / (x1 - x0), height / (y1 - y0))
  return { k, x: width / 2 - (k * (x0 + x1)) / 2, y: height / 2 - (k * (y0 + y1)) / 2 }
}

// Tanker glyph pointing along +x, drawn in screen pixels.
const HULL = "M-8,-2.4 L5,-2.4 Q9,0 5,2.4 L-8,2.4 Z"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Hover =
  | { kind: "route"; x: number; y: number; route: SeaRoute }
  | { kind: "live"; x: number; y: number; tanker: Tanker }
  | { kind: "choke"; x: number; y: number; name: string; detail: string }

export default function TankerMap({
  delay,
  initialView = "world",
  className,
}: {
  delay?: number
  initialView?: string
  className?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const shipLayerRef = useRef<SVGGElement>(null)
  const [width, setWidth] = useState(0)
  const height = Math.max(300, Math.round(width * 0.52))
  const [view, setViewState] = useState(initialView)
  const viewRef = useRef(initialView)
  const setView = useCallback((id: string) => {
    viewRef.current = id
    setViewState(id)
  }, [])
  const [t, setT] = useState<Transform | null>(null)
  const tRef = useRef<Transform | null>(null)
  const [hover, setHover] = useState<Hover | null>(null)
  const [showLive, setShowLive] = useState(true)
  const live = useTankers()

  const projection = useMemo(() => makeProjection(), [])
  const landPath = useMemo(() => {
    const path = geoPath(projection)
    return getCountryRegions("high")
      .map((r) => path(r.geometry))
      .filter(Boolean)
      .join("")
  }, [projection])
  const routes = useMemo(() => SEA_ROUTES.map((r) => projectRoute(projection, r)), [projection])

  const applyT = useCallback((next: Transform) => {
    tRef.current = next
    setT(next)
  }, [])

  // Track container width; fit the current view whenever it changes.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width)
      if (!w) return
      const h = Math.max(300, Math.round(w * 0.52))
      const target = MAP_VIEWS.find((v) => v.id === viewRef.current) ?? MAP_VIEWS[0]
      setWidth(w)
      applyT(viewTransform(projection, target.bounds, w, h))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [applyT, projection])

  // Smoothly fly to a named view.
  const flyTo = useCallback(
    (id: string) => {
      const target = MAP_VIEWS.find((v) => v.id === id)
      if (!target || !width) return
      const to = viewTransform(projection, target.bounds, width, height)
      const from = tRef.current
      setView(id)
      if (!from || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return applyT(to)
      // Interpolate the visible centre and log-scale so zooming feels even.
      const c0 = [(width / 2 - from.x) / from.k, (height / 2 - from.y) / from.k]
      const c1 = [(width / 2 - to.x) / to.k, (height / 2 - to.y) / to.k]
      const start = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / 900)
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
        const k = Math.exp(Math.log(from.k) + (Math.log(to.k) - Math.log(from.k)) * e)
        const cx = c0[0] + (c1[0] - c0[0]) * e
        const cy = c0[1] + (c1[1] - c0[1]) * e
        applyT({ k, x: width / 2 - k * cx, y: height / 2 - k * cy })
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    },
    [applyT, height, projection, setView, width]
  )

  const zoomBy = useCallback(
    (factor: number, cx = width / 2, cy = height / 2) => {
      const cur = tRef.current
      if (!cur) return
      const k = Math.min(60, Math.max(0.5, cur.k * factor))
      const f = k / cur.k
      applyT({ k, x: cx - (cx - cur.x) * f, y: cy - (cy - cur.y) * f })
      setView("")
    },
    [applyT, height, setView, width]
  )

  // Ctrl/⌘ + wheel zooms (plain wheel keeps scrolling the page).
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const rect = svg.getBoundingClientRect()
      zoomBy(Math.exp(-e.deltaY * 0.002), e.clientX - rect.left, e.clientY - rect.top)
    }
    svg.addEventListener("wheel", onWheel, { passive: false })
    return () => svg.removeEventListener("wheel", onWheel)
  }, [zoomBy])

  // Drag to pan.
  const drag = useRef<{ x: number; y: number; t: Transform } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    if (!tRef.current) return
    drag.current = { x: e.clientX, y: e.clientY, t: tRef.current }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    applyT({ ...d.t, x: d.t.x + e.clientX - d.x, y: d.t.y + e.clientY - d.y })
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 3) {
      setView("")
      setHover(null)
    }
  }
  const onPointerUp = () => {
    drag.current = null
  }

  const ready = t !== null

  // Animate ships by writing transforms directly (no React re-render per frame).
  useEffect(() => {
    const layer = shipLayerRef.current
    if (!layer) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const nodes = Array.from(layer.querySelectorAll<SVGGElement>("[data-ship]"))
    let raf = 0
    const start = performance.now()
    const frame = (now: number) => {
      const cur = tRef.current
      if (cur) {
        const secs = reduced ? 0 : (now - start) / 1000
        for (const node of nodes) {
          const r = routes[Number(node.dataset.route)]
          const i = Number(node.dataset.ship)
          const dist = (secs * SHIP_SPEED + (i / r.ships) * r.length) % r.length
          const [px, py, angle] = pointAt(r, dist)
          node.setAttribute("transform", `translate(${(cur.x + cur.k * px).toFixed(1)},${(cur.y + cur.k * py).toFixed(1)}) rotate(${angle.toFixed(1)})`)
        }
      }
      if (!reduced) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    if (reduced) frame(start)
    return () => cancelAnimationFrame(raf)
  }, [routes, ready])

  const screen = (lng: number, lat: number): [number, number] | null => {
    const p = projection([lng, lat])
    if (!p || !t) return null
    return [t.x + t.k * p[0], t.y + t.k * p[1]]
  }

  const liveTankers = showLive ? live.data?.vessels ?? [] : []
  const ports = useMemo(() => {
    const seen = new Map<string, LngLat>()
    for (const r of SEA_ROUTES) {
      seen.set(r.from, r.points[0])
      seen.set(r.to, r.points[r.points.length - 1])
    }
    return [...seen.entries()]
  }, [])

  const liveStatus = live.data
    ? `${live.data.vessels.length} tankers · AIS snapshot ${new Date(live.data.fetched_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`
    : live.isLoading
      ? "Loading live AIS positions…"
      : "Live AIS positions appear once an aisstream.io key is configured"

  return (
    <Panel
      title="Tanker traffic"
      subtitle="Major crude routes by sea, with animated tankers on each lane, plus real tanker positions from AIS when available."
      className={cn("lg:col-span-full", className)}
      delay={delay}
      actions={
        <div className="flex flex-wrap gap-1">
          {MAP_VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => flyTo(v.id)}
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                view === v.id && "border-foreground bg-foreground text-background hover:text-background"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      }
    >
      <div ref={wrapRef} className="relative w-full overflow-hidden rounded-lg border bg-sky-50 dark:bg-slate-950">
        {width > 0 && t && (
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="block cursor-grab touch-none select-none active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onDoubleClick={(e) => {
              const rect = svgRef.current!.getBoundingClientRect()
              zoomBy(2, e.clientX - rect.left, e.clientY - rect.top)
            }}
            role="img"
            aria-label="Map of crude oil tanker routes and live tanker positions"
          >
            <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
              <path
                d={landPath}
                className="fill-stone-200 stroke-stone-300 dark:fill-slate-800 dark:stroke-slate-700"
                strokeWidth={0.6}
                vectorEffect="non-scaling-stroke"
              />
              {routes.map((r, i) => (
                <path
                  key={r.route.id}
                  d={r.d}
                  fill="none"
                  stroke={SHIP_COLOR}
                  strokeOpacity={0.55}
                  strokeWidth={1.2}
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  data-route={i}
                />
              ))}
            </g>

            {/* Ports: labelled once zoomed in */}
            {ports.map(([name, [lng, lat]]) => {
              const p = screen(lng, lat)
              if (!p) return null
              return (
                <g key={name} transform={`translate(${p[0]},${p[1]})`} className="pointer-events-none">
                  <circle r={2.5} className="fill-foreground" />
                  {t.k >= 2.2 && (
                    <text x={5} y={3} className="fill-foreground text-[10px] font-medium" paintOrder="stroke" stroke="var(--background)" strokeWidth={3}>
                      {name.split(",")[0]}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Chokepoints */}
            {GLOBAL_CHOKEPOINTS.map((c) => {
              const p = screen(c.coordinates[0], c.coordinates[1])
              if (!p) return null
              return (
                <g
                  key={c.id}
                  transform={`translate(${p[0]},${p[1]})`}
                  onPointerEnter={() => setHover({ kind: "choke", x: p[0], y: p[1], name: c.name, detail: `${c.volumeMbd} mb/d transit · ${c.description}` })}
                  onPointerLeave={() => setHover(null)}
                >
                  <rect x={-4} y={-4} width={8} height={8} transform="rotate(45)" fill={CHOKE_COLOR} stroke="white" strokeWidth={1} />
                  {t.k >= 1.6 && (
                    <text x={8} y={-6} fill={CHOKE_COLOR} className="text-[10px] font-semibold" paintOrder="stroke" stroke="var(--background)" strokeWidth={3}>
                      {c.name}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Live AIS tankers */}
            {liveTankers.map((v) => {
              const p = screen(v.lng, v.lat)
              if (!p || p[0] < -10 || p[1] < -10 || p[0] > width + 10 || p[1] > height + 10) return null
              return (
                <g
                  key={v.mmsi}
                  transform={`translate(${p[0]},${p[1]}) rotate(${(v.cog ?? 0) - 90})`}
                  onPointerEnter={() => setHover({ kind: "live", x: p[0], y: p[1], tanker: v })}
                  onPointerLeave={() => setHover(null)}
                >
                  <path d="M-4,-3 L5,0 L-4,3 Z" fill={LIVE_COLOR} stroke="white" strokeWidth={0.6} />
                </g>
              )
            })}

            {/* Animated tankers (positions written by the animation loop) */}
            <g ref={shipLayerRef}>
              {routes.flatMap((r, ri) =>
                Array.from({ length: r.ships }, (_, i) => (
                  <g
                    key={`${r.route.id}-${i}`}
                    data-route={ri}
                    data-ship={i}
                    onPointerEnter={(e) => {
                      const rect = svgRef.current!.getBoundingClientRect()
                      setHover({ kind: "route", x: e.clientX - rect.left, y: e.clientY - rect.top, route: r.route })
                    }}
                    onPointerLeave={() => setHover(null)}
                  >
                    <path d={HULL} fill={SHIP_COLOR} stroke="#78350F" strokeWidth={0.8} />
                    <rect x={-7} y={-1.4} width={2.6} height={2.8} fill="white" />
                  </g>
                ))
              )}
            </g>
          </svg>
        )}

        {/* Zoom controls */}
        <div className="absolute top-2 right-2 flex flex-col overflow-hidden rounded-md border bg-background/90 shadow-sm">
          <button onClick={() => zoomBy(1.6)} className="p-1.5 hover:bg-muted" aria-label="Zoom in">
            <Plus className="size-4" />
          </button>
          <button onClick={() => zoomBy(1 / 1.6)} className="border-t p-1.5 hover:bg-muted" aria-label="Zoom out">
            <Minus className="size-4" />
          </button>
          <button onClick={() => flyTo("world")} className="border-t p-1.5 hover:bg-muted" aria-label="Reset view">
            <RotateCcw className="size-4" />
          </button>
        </div>

        {/* Tooltip */}
        {hover && (
          <div
            className="pointer-events-none absolute z-10 max-w-64 rounded-md border bg-background/95 px-3 py-2 text-xs shadow-md"
            style={{
              left: Math.min(hover.x + 12, width - 260),
              top: Math.max(4, hover.y - 12),
            }}
          >
            {hover.kind === "route" && (
              <>
                <div className="font-medium">
                  {hover.route.from} → {hover.route.to}
                </div>
                <div className="text-muted-foreground">{hover.route.vessel}</div>
                <div className="text-muted-foreground">≈ {hover.route.mbd} million bbl/day on this route</div>
              </>
            )}
            {hover.kind === "live" && (
              <>
                <div className="font-medium">{hover.tanker.name || `MMSI ${hover.tanker.mmsi}`}</div>
                <div className="text-muted-foreground">
                  {hover.tanker.sog != null ? `${hover.tanker.sog.toFixed(1)} kn` : "speed n/a"}
                  {hover.tanker.destination ? ` · to ${hover.tanker.destination}` : ""}
                </div>
                <div className="text-muted-foreground">Seen {new Date(hover.tanker.time).toLocaleString([], { timeStyle: "short", dateStyle: "short" })}</div>
              </>
            )}
            {hover.kind === "choke" && (
              <>
                <div className="font-medium">{hover.name}</div>
                <div className="text-muted-foreground">{hover.detail}</div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <svg width="18" height="8" aria-hidden>
            <path d="M1,1.6 L12,1.6 Q16,4 12,6.4 L1,6.4 Z" fill={SHIP_COLOR} />
          </svg>
          Typical routes (animated, illustrative)
        </span>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input type="checkbox" checked={showLive} onChange={(e) => setShowLive(e.target.checked)} className="accent-emerald-500" />
          <svg width="10" height="8" aria-hidden>
            <path d="M1,1 L9,4 L1,7 Z" fill={LIVE_COLOR} />
          </svg>
          {liveStatus}
        </label>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rotate-45" style={{ background: CHOKE_COLOR }} />
          Chokepoints
        </span>
        <span className="sm:ml-auto">Drag to pan · double-click or Ctrl + scroll to zoom</span>
      </div>
    </Panel>
  )
}
