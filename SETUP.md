# Demand Forecasting Wireframe — Quick Start

## Prerequisites
- **Docker** or **Podman** installed (with docker-compose / podman-compose)

## Setup (2 minutes)

1. Unzip this folder and `cd` into it:
   ```bash
   cd "Demand Forecasting WF"
   ```

2. Start the container:
   ```bash
   # Docker:
   docker compose up -d

   # Or Podman:
   podman compose up -d
   ```

3. Install dependencies and start the dev server:
   ```bash
   # Docker:
   docker exec -it demandforecastingwf-app-1 pnpm install
   docker exec -d demandforecastingwf-app-1 pnpm dev

   # Or Podman:
   podman exec -it demandforecastingwf_app_1 pnpm install
   podman exec -d demandforecastingwf_app_1 pnpm dev
   ```

4. Open **http://localhost:5173** in your browser.

## Alternative (no Docker)

If you have **Node.js 20+** and **pnpm** installed locally:

```bash
cd "Demand Forecasting WF"
pnpm install
pnpm dev
```

Then open **http://localhost:5173**.

## What You're Looking At

Select a NIIN from the search bar to explore the full demand forecasting control view. Key features:
- Forecast chart with confidence bands and Monte Carlo simulation
- Scenario builder (drawer on the right) — adjust demand/supply parameters
- Portfolio heatmap (Analytics tab) — 20 NIINs at a glance
- Digital Twin simulation (Logistics Planning tab) — inject disruption events
- AI Copilot (bot icon in header)
- Dark mode toggle (moon icon in header)
