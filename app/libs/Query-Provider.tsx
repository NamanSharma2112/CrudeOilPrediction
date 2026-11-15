"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // One client per browser session; useState keeps it stable across re-renders.
  const [client] = React.useState(() => new QueryClient())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
