import { BrainCircuit, Factory, Info, LayoutDashboard, LineChart, Ship, type LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  description: string
}

/** Dashboard pages, in sidebar order. Used by the sidebar, navbar and command menu. */
export const DASHBOARD_NAV: NavItem[] = [
  { title: "Overview", url: "/", icon: LayoutDashboard, description: "Everything at a glance" },
  { title: "Forecasting", url: "/forecasting", icon: BrainCircuit, description: "ML price forecasts for WTI and Brent" },
  { title: "Markets", url: "/markets", icon: LineChart, description: "Prices, spread and cross-asset moves" },
  { title: "Production", url: "/production", icon: Factory, description: "Who produces the world's oil" },
  { title: "Supply chain", url: "/supply-chain", icon: Ship, description: "Trade routes and chokepoints" },
]

export const HELP_NAV: NavItem[] = [
  { title: "About & data", url: "/about", icon: Info, description: "Data sources, update schedule, model" },
]

export const REPO_URL = "https://github.com/NamanSharma2112/CrudeOilPrediction"

export function navItemFor(pathname: string): NavItem | undefined {
  return [...DASHBOARD_NAV, ...HELP_NAV].find((item) => item.url === pathname)
}
