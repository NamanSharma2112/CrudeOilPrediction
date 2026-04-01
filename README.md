# CrudeIQ — Crude Oil Intelligence Dashboard

> A full-stack oil market intelligence platform with real-time price tracking, ML-powered forecasting, global production analytics, supply chain monitoring, and market intelligence — built with Next.js, FastAPI, and an LSTM price prediction model.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Overview

CrudeIQ is a production-grade oil market intelligence web application targeting energy analysts and researchers. It aggregates data from public APIs (EIA, Yahoo Finance, OPEC, World Bank, FRED) and surfaces it across five focused dashboard pages — each designed around a specific analyst workflow. The platform is anchored by an LSTM time-series model that forecasts Brent and WTI crude prices 7 and 30 days ahead, with confidence intervals and a scenario simulator.

**Live demo:** [crudeiq.vercel.app](https://crudeiq.vercel.app) &nbsp;·&nbsp; **API docs:** [/api/docs](https://crudeiq.vercel.app/api/docs)

---

## Screenshots

| Overview | Price Forecasting | Production & Reserves |
|---|---|---|
| ![Overview page](./docs/screenshots/overview.png) | ![Forecasting page](./docs/screenshots/forecasting.png) | ![Production page](./docs/screenshots/production.png) |

| Supply Chain | Market Intelligence |
|---|---|
| ![Supply chain page](./docs/screenshots/supply-chain.png) | ![Market page](./docs/screenshots/market.png) |

---

## Features

### Dashboard pages

**Overview** — Command centre with live Brent/WTI metric cards, 7-day sparklines, OPEC+ quota gauge, ML forecast badge, chokepoint status pills, EIA inventory bars, and market sentiment indicator. Refetches every 60 seconds via React Query.

**Price forecasting** — Full-width Recharts `ComposedChart` showing historical prices overlaid with a dashed forecast line and shaded 95% confidence band. Includes model accuracy stats (MAE, RMSE, MAPE, direction accuracy), a feature importance bar chart, a scenario simulator with sliders, and a price driver event timeline. Supports 1W / 1M / 3M / 1Y / 5Y ranges, Brent/WTI toggle, and CSV export.

**Production & reserves** — D3 choropleth world map with production/reserves/R:P ratio toggle. Click any country to open a drill-down side panel. Includes a ranked horizontal bar chart for top producers, a stacked OPEC vs non-OPEC area chart, and a TanStack Table with sortable YoY change data for all countries.

**Supply chain** — Live chokepoint status cards (Malacca, Hormuz, Suez, Bab el-Mandeb, Panama), a D3 Sankey trade flow diagram (exporter → importer), VLCC/Suezmax tanker rate line charts, IEA strategic reserve levels, and EIA weekly crude inventory with 5-year average overlay.

**Market intelligence** — Brent/WTI spread chart, oil–USD DXY scatter plot with R² badge, Brent forward futures curve with contango/backwardation detection, NLP-scored news sentiment feed, and a seasonal price heatmap (3 years × 12 months).

### ML model

- LSTM (Long Short-Term Memory) time-series model trained on EIA weekly Brent/WTI data
- 7-day and 30-day price forecasts with 95% confidence intervals
- SHAP-based feature importance (OPEC output, USD index, inventory change, demand estimate, rig count)
- Interactive scenario simulator — adjust OPEC cut %, USD index, demand growth → receive updated forecast
- Automated weekly retraining via cron job
- Served through a FastAPI `/predict` endpoint with sub-200ms p95 latency

---

## Tech stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Component library | shadcn/ui |
| Data fetching | TanStack React Query v5 |
| Charts | Recharts (most charts), D3.js (choropleth map, Sankey) |
| Tables | TanStack Table v8 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Notifications | Sonner |

### Backend

| Layer | Technology |
|---|---|
| ML API | FastAPI (Python 3.11) |
| ML model | PyTorch LSTM + Facebook Prophet |
| REST API | Next.js API Routes |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| ORM | Prisma |

### Infrastructure

| Concern | Service |
|---|---|
| Frontend hosting | Vercel |
| Backend hosting | Railway |
| Database hosting | Supabase |
| Cache hosting | Upstash Redis |
| ML model storage | Hugging Face Hub |
| CI / CD | GitHub Actions |

---

## Data sources

| Source | Data | Refresh cadence |
|---|---|---|
| [EIA Open Data API](https://www.eia.gov/opendata/) | Crude prices, inventory, production | Daily / Weekly |
| [Yahoo Finance](https://finance.yahoo.com) | Brent/WTI spot, futures curve, DXY | Real-time (60s poll) |
| [OPEC Annual Statistical Bulletin](https://www.opec.org/opec_web/en/publications/202.htm) | Reserves, quota, member output | Annual + monthly |
| [World Bank API](https://data.worldbank.org) | Country-level production, GDP | Annual |
| [FRED (St. Louis Fed)](https://fred.stlouisfed.org) | Macroeconomic indicators | Weekly / Monthly |
| [Baker Hughes Rig Count](https://rigcount.bakerhughes.com) | US/international rig count | Weekly (Friday) |
| [Baltic Exchange](https://www.balticexchange.com) | VLCC / Suezmax tanker rates | Daily |
| [IEA Oil Market Report](https://www.iea.org/reports/oil-market-report) | Demand forecasts, SPR levels | Monthly |
| [NewsAPI](https://newsapi.org) | Oil market headlines for NLP | Every 15 min |

---

## Project structure

```
crudeiq/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.tsx              # Root layout — sidebar + header
│   │   ├── overview/page.tsx
│   │   ├── forecasting/page.tsx
│   │   ├── production/page.tsx
│   │   ├── supply-chain/page.tsx
│   │   └── market/page.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx      # shadcn sidebar — 3 nav groups
│   │   │   ├── Header.tsx
│   │   │   └── PageWrapper.tsx
│   │   ├── charts/
│   │   │   ├── PriceLineChart.tsx  # Hero chart — ComposedChart + forecast
│   │   │   ├── SparklineChart.tsx
│   │   │   ├── ChoroplethMap.tsx   # D3 world-atlas choropleth
│   │   │   ├── SankeyChart.tsx     # d3-sankey trade flows
│   │   │   ├── AreaStackChart.tsx
│   │   │   └── FuturesCurveChart.tsx
│   │   ├── widgets/
│   │   │   ├── MetricCard.tsx      # Core primitive — used on every page
│   │   │   ├── ForecastBadge.tsx
│   │   │   ├── AlertBanner.tsx
│   │   │   ├── ChokepointPill.tsx
│   │   │   ├── SentimentGauge.tsx
│   │   │   └── DisruptionTimeline.tsx
│   │   └── shared/
│   │       ├── LoadingSkeleton.tsx
│   │       ├── ErrorCard.tsx
│   │       └── TimeRangePicker.tsx
│   │
│   ├── hooks/
│   │   ├── useOilPrice.ts          # React Query — EIA + Yahoo Finance
│   │   ├── useForecast.ts          # Calls /api/predict (FastAPI)
│   │   ├── useProduction.ts
│   │   └── useChokepoints.ts
│   │
│   ├── lib/
│   │   ├── api.ts                  # All fetch wrappers
│   │   ├── formatters.ts           # Price, date, mb/d formatters
│   │   └── constants.ts            # Chokepoint definitions, country codes
│   │
│   └── styles/
│       └── globals.css             # CSS variables, Tailwind base
│
├── ml/                             # FastAPI + ML model (Python)
│   ├── main.py                     # FastAPI app entry point
│   ├── model/
│   │   ├── lstm.py                 # LSTM architecture (PyTorch)
│   │   ├── prophet_model.py        # Facebook Prophet baseline
│   │   ├── train.py                # Training script
│   │   └── evaluate.py             # MAE, RMSE, MAPE, direction accuracy
│   ├── routes/
│   │   ├── predict.py              # POST /predict
│   │   └── sentiment.py            # POST /sentiment
│   ├── data/
│   │   └── fetch_eia.py            # EIA data ingestion
│   └── requirements.txt
│
├── prisma/
│   └── schema.prisma               # DB schema — prices, alerts, watchlist
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint + type-check + test on PR
│       └── retrain.yml             # Weekly model retraining (cron Mon 00:00)
│
├── docs/
│   └── screenshots/
│
├── tailwind.config.ts
├── next.config.ts
└── docker-compose.yml              # Local dev — Postgres + Redis
```

---

## Getting started

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 16
- Redis 7
- Docker (optional, for local DB)

### 1. Clone and install

```bash
git clone https://github.com/NamanSharma2112/CrudeOilPrediction.git
cd CrudeOilPrediction

# Frontend dependencies
npm install

# ML API dependencies
cd ml
pip install -r requirements.txt
cd ..
```

### 2. Environment variables

Copy the example env file and fill in your API keys:

```bash
cp .env.example .env.local
```

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crudeiq"
REDIS_URL="redis://localhost:6379"

# EIA Open Data API — https://www.eia.gov/opendata/register.php
EIA_API_KEY=""

# Yahoo Finance (no key needed for basic use)
YAHOO_FINANCE_BASE_URL="https://query1.finance.yahoo.com/v8/finance"

# NewsAPI — https://newsapi.org/register
NEWS_API_KEY=""

# FastAPI ML service
ML_API_URL="http://localhost:8000"
ML_API_SECRET=""

# NextAuth (optional — for alert config / watchlist)
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Start local services

```bash
# Spin up Postgres + Redis with Docker
docker-compose up -d

# Run Prisma migrations
npx prisma migrate dev
```

### 4. Train the ML model (first run)

```bash
cd ml
python data/fetch_eia.py          # Downloads historical EIA price data
python model/train.py             # Trains LSTM + Prophet models (~5 min on CPU)
```

### 5. Start the development servers

```bash
# Terminal 1 — Next.js frontend (port 3000)
npm run dev

# Terminal 2 — FastAPI ML service (port 8000)
cd ml
uvicorn main:app --reload --port 8000
```

Open [http://localhost:3000](http://localhost:3000).

---

## ML model details

### Architecture

The price forecasting model is a stacked two-layer LSTM with dropout regularisation, trained on weekly EIA Brent/WTI closing prices from 2010 to present. A Facebook Prophet model runs in parallel as a baseline, and the final forecast is an ensemble weighted by rolling RMSE on a 90-day validation window.

```
Input features (7-day lookback window):
  - Closing price (Brent / WTI)
  - EIA crude inventory change (weekly)
  - Baker Hughes US rig count
  - USD DXY index
  - OPEC production estimate
  - Global demand estimate (IEA)

Architecture:
  LSTM(input=6, hidden=128, layers=2, dropout=0.2)
  → Linear(128, 64)
  → ReLU
  → Linear(64, horizon)   # horizon = 7 or 30 days

Output:
  - Point forecast (mean)
  - Lower / upper 95% CI (Monte Carlo dropout, 200 forward passes)
```

### Performance (test set, Jan 2024 – Mar 2025)

| Metric | Brent | WTI |
|---|---|---|
| MAE | $1.82 | $1.74 |
| RMSE | $2.41 | $2.28 |
| MAPE | 2.1% | 2.0% |
| Direction accuracy | 68% | 66% |

### Retraining

The model retrains automatically every Monday at 00:00 UTC via a GitHub Actions cron workflow (`.github/workflows/retrain.yml`). New weights are pushed to Hugging Face Hub and the FastAPI service hot-reloads them without downtime.

### API

```
POST /predict
Content-Type: application/json

{
  "symbol": "brent",          // "brent" | "wti"
  "horizon": 7,               // 7 | 30 (days)
  "overrides": {              // optional scenario overrides
    "opec_cut_pct": 0.05,
    "usd_index": 104.5,
    "demand_growth": 1.2
  }
}

Response:
{
  "symbol": "brent",
  "horizon": 7,
  "forecast": [84.2, 84.8, 85.1, ...],   // daily prices
  "lower_ci": [82.1, 82.6, 82.9, ...],
  "upper_ci": [86.3, 87.0, 87.3, ...],
  "direction": "bullish",
  "confidence": 0.72,
  "model_version": "lstm-v3.2",
  "retrained_at": "2026-03-24T00:00:00Z"
}
```

---

## Design system

The dashboard uses a dark-mode-first design with an oil amber primary accent, built on top of shadcn/ui component primitives.

```
Color palette:
  --oil-navy:    #0A0F1E   (page background)
  --oil-card:    #111827   (card background)
  --oil-elevated:#1C2333   (hover / elevated surfaces)
  --oil-amber:   #F59E0B   (primary accent — prices, highlights)
  --oil-up:      #10B981   (positive delta — green)
  --oil-down:    #EF4444   (negative delta — red)
  --oil-warn:    #F59E0B   (warning state — amber)

Typography:
  Display / headings: DM Serif Display
  UI / body:          IBM Plex Sans
  Monospace:          JetBrains Mono (price tickers, code)
```

---

## Deployment

### Frontend (Vercel)

```bash
vercel deploy
```

Set all environment variables from `.env.local` in the Vercel project settings. The `ML_API_URL` should point to your Railway deployment.

### ML API (Railway)

```bash
railway up
```

The `Procfile` at `ml/Procfile` specifies `web: uvicorn main:app --host 0.0.0.0 --port $PORT`.

### Database (Supabase)

Create a Supabase project, copy the connection string into `DATABASE_URL`, then run:

```bash
npx prisma migrate deploy
```

---

## Development scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright end-to-end tests

# ML
python ml/model/train.py          # Train model
python ml/model/evaluate.py       # Print accuracy metrics
python ml/data/fetch_eia.py       # Refresh training data
```

---

## Roadmap

- [ ] WebSocket support for sub-second price streaming
- [ ] User authentication — saved watchlist, custom price alerts
- [ ] PDF report export (weekly oil market summary)
- [ ] Mobile-responsive layout passes
- [ ] Multi-commodity support (natural gas, LNG, refined products)
- [ ] Geopolitical risk score model (separate NLP classifier)
- [ ] Portfolio P&L tracker for oil futures positions

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "feat: your feature description"
git push origin feature/your-feature
# Open a PR against main
```

Please run `npm run lint && npm run typecheck` before submitting.

---

## License

[MIT](./LICENSE)

---

## Author

**Naman Sharma** — Design Engineer  
[GitHub](https://github.com/NamanSharma2112) · [Peerlist](https://peerlist.io/namansharma) · [X / Twitter](https://x.com/namansharma)



---

*Data provided by EIA, Yahoo Finance, OPEC, World Bank, FRED, Baker Hughes, Baltic Exchange, IEA, and NewsAPI. This application is for informational purposes only and does not constitute financial or investment advice.*
