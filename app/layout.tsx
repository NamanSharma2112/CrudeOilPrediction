import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import AppSidebar from "../components/AppSidebar"
import Navbar from "../components/Navbar"
import { ThemeProvider } from "./libs/Theme-Provider";
import { QueryProvider } from "./libs/Query-Provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cookies } from "next/headers";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrudeIQ — Crude Oil Intelligence",
  description: "Live crude oil prices, ML forecasts, global production and trade flows.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body suppressHydrationWarning>
       <ThemeProvider
         attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
       >
       <QueryProvider>
       <TooltipProvider delayDuration={0}>
       <SidebarProvider defaultOpen={defaultOpen}>
       <AppSidebar/>
       <main className="w-full">
        <Navbar/>
       <div className="px-4">{children}</div>
       </main>
       </SidebarProvider>
       </TooltipProvider>
       </QueryProvider>
</ThemeProvider>
      </body>
    </html>
  );
}
