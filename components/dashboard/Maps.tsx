"use client"

// The maps draw with canvas/SVG measured in the browser, so they skip SSR.
import dynamic from "next/dynamic"
import { MapSkeleton } from "meridian-ui"

export const ProductionMap = dynamic(() => import("./OilMaps").then((m) => m.ProductionMap), {
  ssr: false,
  loading: () => <MapSkeleton className="lg:col-span-full" />,
})

export const ChokepointGlobe = dynamic(() => import("./OilMaps").then((m) => m.ChokepointGlobe), {
  ssr: false,
  loading: () => <MapSkeleton shape="globe" />,
})

export const TankerMap = dynamic(() => import("./TankerMap"), {
  ssr: false,
  loading: () => <MapSkeleton className="lg:col-span-full" />,
})
