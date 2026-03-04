PRD: Advanced Demand Forecasting Tab (Supply Chain)

Format: Atomic, verifiable tasks with acceptance criteria
Product surface: Front-end “realm of possible” wireframe (not production analytics)

1) Goal

Deliver a NIIN-level, decision-focused page that helps a planner answer: “Will we stock out or carry excess, when, and what action prevents it at lowest cost?” The design must prioritize prescriptive actions and workflow, not passive reporting.  ￼

2) Definition of Done (applies to every task)

A task is “done” only when it meets its feature-specific acceptance criteria and the common quality checklist (DoD vs acceptance criteria distinction).  ￼
DoD checklist (for this UI wireframe build):
	•	Implemented in the prototype framework (Claude output) and renders without errors
	•	All controls are clickable with realistic dummy states
	•	All numbers/charts update consistently when inputs change (even if data is mocked)
	•	Empty, loading, and error states exist for every panel
	•	Copy is decision-oriented and unambiguous (testable acceptance criteria)  ￼

⸻

3) Epics and atomic tasks

EPIC A: Navigation + NIIN selection

A1. Create “Advanced Demand Forecasting” tab entry under Supply Chain

Acceptance criteria (verifiable):
	•	Given the user is on Supply Chain, when they click “Advanced Demand Forecasting,” then the tab loads and shows “NIIN Control View” by default.

A2. Add NIIN type-ahead selector (required)

Acceptance criteria:
	•	Given the user types 3+ characters, when results exist, then a dropdown shows matching NIINs (code + nomenclature).
	•	Given the user selects a NIIN, when selection completes, then every section on the page refreshes to that NIIN context.

A3. Add global filters row (platform, commodity group, supplier, echelon, horizon)

Acceptance criteria:
	•	Given filters are changed, when applied, then the page reflects the new state (cards, charts, tables update).
	•	Given “Reset filters” is clicked, then all filters return to default and the selected NIIN remains.

A4. Add scenario selector + “Edit scenario” button (opens drawer)

Acceptance criteria:
	•	Given baseline scenario is selected, when user switches to another scenario, then the forecast line and stockout probability visibly change.

(Write these as atomic, testable criteria. Gherkin is acceptable; keep scenarios single-purpose.)  ￼

⸻

EPIC B: NIIN Snapshot header (decision context)

B1. Build NIIN metadata card (left)

Fields: NIIN, nomenclature, platform(s), criticality flag (MICAP), single-source flag, current lead time, unit cost.
Acceptance criteria:
	•	Given a NIIN is selected, when the header renders, then all metadata fields populate (or show “Unknown” with tooltip if missing).

B2. Build operational tiles (center)

Tiles: On-hand, On-order, Backorders, Demand next 90d, Demand next 12mo.
Acceptance criteria:
	•	Given a filter change, when tiles refresh, then values update and remain internally consistent (On-hand + On-order does not change unless inputs do).

B3. Build risk tiles (right)

Tiles: Stockout probability (90d, 24mo), first projected stockout date, service level vs policy, confidence score.
Acceptance criteria:
	•	Given scenario sliders change, when “Apply” is clicked, then stockout probability and projected stockout date change within the UI state.
	•	Given confidence is low, then the tile displays “Low” and a tooltip explains the basis (mocked logic allowed).

⸻

EPIC C: Forecast visual with uncertainty (core visual)

C1. Render primary time-series chart

Shows historical demand + forecast out to selected horizon; confidence band shown.
Acceptance criteria:
	•	Given horizon = 2y/5y/10y/20y, when horizon changes, then x-axis range adjusts and confidence band visibly widens with time (even in mock).
	•	Given “Units/$” toggle is changed, then y-axis label and values switch accordingly.

C2. Add chart controls (granularity + overlay)

Controls: Monthly/Quarterly/Annual; Baseline vs Scenario overlay.
Acceptance criteria:
	•	Given overlay enabled, when scenario differs from baseline, then two distinct lines appear with legend.

C3. Add annotation markers (events)

Markers: contract change, engineering change, planned retirements (mocked).
Acceptance criteria:
	•	Given at least one event exists, when user hovers marker, then tooltip shows event name and date.

(Explicit uncertainty and scenario comparison are central to monitoring forecasts and decisioning.)  ￼

⸻

EPIC D: Supply sufficiency overlay (can supply keep up?)

D1. Time-phased inventory position bars (left panel)

Bars: starting inventory, receipts, consumption, ending inventory; safety stock line.
Acceptance criteria:
	•	Given a time bucket, when hover occurs, then tooltip shows the components (start, receipts, demand, end, safety stock).
	•	Given safety stock breach, then the bucket highlights (red/amber) and breach appears in the table.

D2. Shortfall / breach table (right panel)

Columns: period, forecast demand, available supply, gap, stockout probability, days-to-impact.
Acceptance criteria:
	•	Given breaches exist, then table shows only breach rows by default and includes a “Show all periods” toggle.

D3. Add “Rebalance candidates” quick view (optional P1)

Shows where inventory can be moved from (other bases/echelons).
Acceptance criteria:
	•	Given “Rebalance” is selected as a recommended action, then the UI surfaces candidate sources and estimated transfer time (mock).

⸻

EPIC E: Prescriptive recommendations (turn insight into action)

This is the differentiator of a control-tower-style UI: recommendations + workflow, not just dashboards.  ￼

E1. Build “Recommended Actions” table (top 5–10)

Rows: Buy, Expedite, Rebalance, Alternate source.
Columns: action, qty, required-by date, cost impact, service uplift or risk reduction, confidence, owner, status.
Acceptance criteria:
	•	Given selected NIIN, when recommendations load, then at least 3 action types can appear (mocked).
	•	Given user changes scenario, when applied, then at least one recommendation quantity or timing changes.

E2. Action detail flyout (click a row)

Shows rationale: what risk it mitigates, what time bucket breach it resolves, assumptions.
Acceptance criteria:
	•	Given a row click, when flyout opens, then it shows “Impact if executed” and “Impact if not executed” fields.

E3. “Approve / Export action plan” controls

Buttons: Approve (changes status), Export (CSV/PDF mock).
Acceptance criteria:
	•	Given Approve is clicked, then status changes to “Approved” and persists until reset.
	•	Given Export is clicked, then a file is generated or a modal confirms export payload contents (prototype acceptable).

E4. Cost vs Service tradeoff widget (P1 if time allows)

Curve + budget slider.
Acceptance criteria:
	•	Given slider moves, then recommended action set updates (at least count and total cost).

(Decision engine + coordinated actions is a key control tower concept.)  ￼

⸻

EPIC F: Scenario builder drawer (realm-of-possible engine)

F1. Build scenario drawer UI (right-side)

Controls: failure rate multiplier, utilization multiplier, lead time shock, capacity cap, seasonality strength.
Acceptance criteria:
	•	Given drawer open, when sliders change, then “Pending changes” indicator appears until Apply is clicked.

F2. Drawer outputs (always visible in footer)

Outputs: updated stockout probabilities, delta spend, delta service level, delta recommended buy qty.
Acceptance criteria:
	•	Given Apply is clicked, then all outputs update and match the main page’s tiles and charts.

⸻

EPIC G: Credibility and explainability (kept lightweight)

G1. Forecast driver decomposition (collapsed by default)

Shows contribution of seasonality, utilization, failure rate trend, etc.
Acceptance criteria:
	•	Given “Drivers” expands, when a driver is toggled off, then forecast changes (even if mock).

G2. Forecast quality panel (collapsed by default)

Metrics: MAPE, bias, volatility index, last forecast vs actual.
Acceptance criteria:
	•	Given panel expands, then at least 3 metrics populate with definitions via tooltip.

(Keep acceptance criteria demonstrably verifiable and concise.)  ￼

⸻

EPIC H: States, guardrails, and UX hygiene

H1. Loading and no-data states for each section

Acceptance criteria:
	•	Given data missing, then each section shows a clear no-data message and does not break layout.

H2. Error state pattern

Acceptance criteria:
	•	Given a simulated API error toggle, then user sees a recoverable error message and “Retry” works (mock).

H3. Consistent units and rounding

Acceptance criteria:
	•	Given “Units vs $” changes, then all currency fields show $ and consistent rounding across tiles/tables.

⸻

4) Prioritization (for an MVP wireframe that demos well)

P0 (must ship for demo): A2, A3, B1–B3, C1–C2, D1–D2, E1–E2, F1–F2, H1
P1 (nice-to-have): C3, D3, E3–E4, G1–G2, H2–H3

⸻

5) Deliverables for Claude (what “done” looks like in the artifact)
	•	One page wireframe: NIIN Control View
	•	One drawer: Scenario builder
	•	One flyout: Recommendation detail
	•	One empty-state + one error-state example

