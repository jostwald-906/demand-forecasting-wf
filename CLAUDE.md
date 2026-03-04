# Demand Forecasting Wireframe - Project Context

## Project Overview
Building an **Advanced Demand Forecasting** wireframe/prototype for a Supply Chain Control Tower application. This is a NIIN-level, decision-focused UI that helps planners answer: "Will we stock out or carry excess, when, and what action prevents it at lowest cost?"

## Tech Stack
- **Framework:** React 18 + TypeScript
- **Build:** Vite 5
- **Styling:** Tailwind CSS 3.4
- **Charts:** Recharts
- **Icons:** Lucide React
- **Package Manager:** pnpm

## Development Environment
All development happens inside a **Podman container** for safety.

### Container Commands
```bash
# Run commands inside the container
podman exec -it demandforecastingwf_app_1 <command>

# Start dev server (if stopped)
podman exec -d demandforecastingwf_app_1 pnpm dev

# Install new packages
podman exec -it demandforecastingwf_app_1 pnpm add <package>

# View container logs
podman logs -f demandforecastingwf_app_1

# Restart container
podman compose restart
```

### Dev Server
- **URL:** http://localhost:5173
- **Hot reload:** Enabled

## Project Structure
```
/Users/Jordan_Ostwald/Demand Forecasting WF/
├── .devcontainer/          # VS Code dev container config
├── src/
│   ├── components/         # React components (create as needed)
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Root component
│   └── index.css          # Tailwind imports
├── public/
├── prd.md                 # Full PRD with requirements
├── progress.txt           # Track completed tasks
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## PRD Summary (see prd.md for full details)

### P0 Tasks (Must Ship)
1. **A2** - NIIN type-ahead selector
2. **A3** - Global filters row (platform, commodity, supplier, echelon, horizon)
3. **B1-B3** - NIIN Snapshot header (metadata, operational tiles, risk tiles)
4. **C1-C2** - Forecast time-series chart with controls
5. **D1-D2** - Supply sufficiency overlay (inventory bars, breach table)
6. **E1-E2** - Recommended Actions table + detail flyout
7. **F1-F2** - Scenario builder drawer
8. **H1** - Loading and no-data states

### P1 Tasks (Nice-to-have)
- C3: Event annotation markers
- D3: Rebalance candidates view
- E3-E4: Approve/Export actions, Cost vs Service widget
- G1-G2: Forecast drivers, quality metrics
- H2-H3: Error states, consistent units

## Deliverables
1. One page wireframe: **NIIN Control View**
2. One drawer: **Scenario builder** (right-side)
3. One flyout: **Recommendation detail**
4. One empty-state + one error-state example

## Tailwind Theme Extensions
```js
colors: {
  primary: { 50-900 },  // Blue scale
  risk: {
    low: '#22c55e',     // Green
    medium: '#f59e0b',  // Amber
    high: '#ef4444',    // Red
  }
}
```

## Coding Guidelines
- Use TypeScript strict mode
- Create mock data that updates with scenario changes
- Every panel needs loading, empty, and error states
- Decision-oriented copy (not passive reporting)
- All controls should be interactive with realistic dummy states

## Workflow
1. Read `prd.md` for detailed acceptance criteria
2. Implement one task at a time
3. Update `progress.txt` after completing each task
4. Test in browser at http://localhost:5173
