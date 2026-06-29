---
description: Port a Jetpack Stats module/card from wp-calypso into a registered Premium Analytics widget, following the package widget contract, then audit it clean.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(grep:*), Bash(find:*), Bash(ls:*), Bash(cat:*), Bash(pnpm:*), Bash(jetpack:*), Bash(npx:*)
---

# Migrate Stats Widget

Port one Jetpack Stats module/card from `wp-calypso` into a registered widget under
`projects/packages/premium-analytics/widgets/<slug>/`, then verify it against the widget
contract with the `/widget-audit` skill.

This skill is the *workflow*. The *invariants* live in three canonical files — read them, do
not paraphrase from memory (they drift):

1. `projects/packages/premium-analytics/AGENTS.md` — package overview, data proxy, and the full
   **Widgets** + **Stats widgets** sections (folder structure, render contract, story template,
   `max` semantics, loading/comparison rules, visual conventions, pitfalls).
2. `.agents/rules/widgets.md` — the shared widget invariants (two-component structure, chrome,
   attribute-shape-declared-once).
3. `.agents/skills/widget-audit.md` — the checklist this work must pass.

Reference ports to read in full before starting (the canonical examples):

- `projects/packages/premium-analytics/widgets/top-posts/` — leaderboard/list pattern.
- `projects/packages/premium-analytics/widgets/locations/` — composite (map + leaderboard),
  local UI state, and a custom view hook wrapping a data hook.

## Inputs to gather

Ask for any not provided, then echo them back before scaffolding:

1. **Widget slug + title** — kebab-case slug (e.g. `referrers`); registered name is `jpa/<slug>`.
   Confirm there is no existing `widgets/<slug>/`.
2. **Source path in wp-calypso** — the module/card file, e.g.
   `client/my-sites/stats/features/modules/stats-referrers/stats-referrers.tsx`. Read it (and its
   siblings) to learn the columns, labels, links, empty state, and any drill-down/tabs.
3. **Reference screenshot** — how the widget should look. Read it to confirm the visualization,
   the metric(s) shown, row labels, and whether a comparison/delta is expected.
4. **Data hook** — which `packages/data` hook supplies the data (see step 2 below). If none fits,
   STOP and flag it as a data-layer task — do not call `fetchStatsProxy`/`apiFetch` from a widget.
5. **Display component** — which `packages/widgets-toolkit` component renders it (`LeaderboardChart`,
   `DonutChart`, `ComparativeLineChart`, `MetricValue`/`MetricWithComparison`, etc.).
6. **Attributes (settings)** — the user-configurable fields (date range comes from the dashboard
   via `reportParams`, NOT an attribute). Typical: `num`/`max` (row count), a view/post-type
   selector. Each declared attribute MUST be consumed in `render.tsx` — no ghost attributes.

## Steps

### 1. Confirm the Linear task and base branch

This widget likely already has a subtask under **WOOA7S-1458** (Port Jetpack Stats cards and
widgets). Find it, **assign it to yourself and set it In Progress** so it's clear it's picked up,
and note which page task(s) in **WOOA7S-1612** (the per-tab ownership parent) compose it — those
are blocked by this work.

Confirm the **base branch** before branching. Port branches are based on the current Premium
Analytics integration branch, NOT trunk (the parallel Woo effort bases on
`update/pa-introduce-customize-dashboard`). Ask the lead / check the most recent merged
Stats-widget PR for the current base and branch-naming schema, then substitute this issue's ID.
One widget = one branch = one draft PR.

### 2. Pick the data hook (do not reinvent)

`packages/data/` already has a typed hook for essentially every Stats module. List them and match:

```bash
grep -rhoE 'export (function|const) (useStats[A-Za-z]+)' projects/packages/premium-analytics/packages/data/src | sort -u
```

Each hook returns `{ primary, comparison, hasComparison, isLoading, isError }`. Reach list data via
`const items = (primary.data as StatsNormalizedReport<StatsXxxItem>)?.data?.[0]?.items ?? []`.
Date-range → `period`/`end_date`/`days` conversion is done inside the query factory — never in the
widget. If the module needs local mode/filter state (geo mode, view type), wrap the data hook in a
small `use-<slug>-view.ts` hook like `locations/use-location-views.ts`.

### 3. Pick the display component (do not reinvent)

List toolkit exports and reuse helpers (`flagUrl`, `calculateDelta`, `formatLegendLabels`) before
writing your own:

```bash
sed -n '1,80p' projects/packages/premium-analytics/packages/widgets-toolkit/src/index.ts
ls projects/packages/premium-analytics/packages/widgets-toolkit/src/helpers/
```

### 4. Scaffold the folder

Create `widgets/<slug>/` with exactly these files (copy the reference ports' structure, not a
legacy `packages/widgets-toolkit/src/widgets/*` widget):

- `package.json` — workspace pkg; internal deps via `link:` and the `@jetpack-premium-analytics/*`
  alias (NEVER `@automattic/jetpack-premium-analytics-*`). Dependencies must mirror imports exactly.
- `widget.json` — `name: jpa/<slug>`, `title`, `description`, `category`, `presentation`
  (`framed` | `content-bleed` | `full-bleed`). This is the source of truth for `presentation`.
- `widget.ts` — default export `{ name, title, icon, attributes?, example? }`; export the
  attribute TS type once. Do NOT declare `presentation` here.
- `render.tsx` — two-component split. Outer is `WidgetRenderProps<T>` (default `attributes = {}`),
  passes `<WidgetRoot attributes={attributes}>`; inner reads `useWidgetRootContext()` for
  `reportParams` and fetches via the hook. Import the attribute type from `./widget`; never
  redeclare it (compose with `Partial<ReportParamsFieldAttributes>` if host fields are needed).
- `<slug>.module.css` — CSS Modules only; tokens from `@wordpress/theme` (`--wpds-*`). No inline
  `style={{}}` in shipped render code. Add the picker-preview aspect-ratio block from AGENTS.md.
- `stories/<slug>-widget.stories.tsx` — copy the three-story template from AGENTS.md verbatim
  (`Default`, `WithComparison`, `WidgetDashboardWithWidget`); call `registerReportMocks()`;
  title `Packages/Premium Analytics/Widgets/<Name>`; `tags: ['autodocs']`.

### 5. Honor the Stats-widget rules (silent at build time if wrong)

- `max = 0` means "all rows": `slice(0, max > 0 ? max : undefined)` — never `slice(0, max)`.
- Loading: `<WidgetLoadingOverlay />` only when `isLoading && data.length === 0`; otherwise pass
  `loading={isLoading}` to the chart so rows stay visible during refetch.
- Comparison: build a lookup from `comparison.data?.[0]?.items` keyed by a stable id (post
  ID/URL, country code, term, device key) and set `previousValue`/`previousShare`/`delta` from the
  matched row — do not assume primary/comparison share order. Only expose a meaningful
  `withComparison` control once real comparison values are mapped (no `previousValue: 0` placeholder
  behind an enabled comparison UI).
- Visual: title `<Text variant="heading-md" render={<h3 />}>`; counts
  `dataFormat={{ type: 'number', options: { useMultipliers: true, decimals: 0 } }}`; 36px rows;
  pass `emptyStateText` to the chart instead of a `data.length === 0` branch.
- Every user-visible string through `__( …, 'jetpack-premium-analytics' )`; comments in English;
  `<button type="button">` for non-submit actions.

### 6. Register the Storybook root (once per repo)

Ensure `projects/packages/premium-analytics/widgets` is in
`projects/js-packages/storybook/storybook/projects.js` (per-widget folders auto-discover after).

### 7. Audit and lint — iterate until clean

- Run `/widget-audit <slug>` and fix every reported violation.
- `npx eslint projects/packages/premium-analytics/widgets/<slug>` (confirms the JSDoc `props` tag,
  CSS tokens, button types, etc.). Re-run until clean.

### 8. Verify it renders

Build and check Storybook for all three stories (Default, WithComparison, dashboard) — the story is
the primary initial-validation surface:

```bash
jetpack build packages/premium-analytics
```

Compare the close-up story against the reference screenshot — layout, metric, labels, empty state,
and the comparison delta. Capture a screenshot for the PR/Linear update.

### 9. Open the draft PR and get CI green

- Add a changelog entry (`/jetpack-changelog`) and open a **draft PR** off the integration base
  branch (step 1), following the PR template; assign it to the issue owner.
- All CI workflows must pass. The **coverage-data** check is the one allowed failure (it fails on
  feature branches not based on trunk). Fix anything else that's red before handing off.

## Done criteria

- `/widget-audit <slug>` and `eslint` both pass.
- All three stories render; Default visually matches the screenshot; WithComparison shows real
  previous-period deltas.
- The data hook is from `packages/data` (no direct proxy/apiFetch); display is a toolkit component;
  no reinvented helpers; no upstream package modified.
- A draft PR is open off the integration base branch with passing CI (coverage-data excepted), and
  the diff is scoped to *just* this widget.
- Linear: the WOOA7S-1458 widget subtask is assigned to the owner, updated, and the blocked page
  task(s) in WOOA7S-1612 noted.

## Porting many widgets in parallel

- Each port is independent: do each in **its own git worktree** to avoid conflicts, on its own
  branch, with its own draft PR.
- Work in **batches of ~5** — complete a batch (PRs up, CI green) before starting the next, so the
  repo's CI/workflow runners aren't overloaded.
- Keep diffs minimal and uniform: a clean widget port adds only `widgets/<slug>/**` (plus the
  one-time Storybook-root registration and a changelog entry). Anything beyond that is a smell.

## Special attention / common failure modes

- Putting the widget under `packages/widgets-toolkit/src/widgets/*` (legacy path) — use top-level
  `widgets/<slug>/`.
- Declaring `presentation` in `widget.ts`, or re-declaring the attribute type in `render.tsx`.
- Dropping `attributes` at the `<WidgetRoot>` boundary (kills date/comparison controls).
- A `withComparison` story control not wired into `reportParams: getDefaultQueryParams(withComparison)`
  → reviewers get a false comparison test.
- Modules with internal tabs or drill-down (Locations, UTM, Devices, Post detail) are NOT single
  flat widgets — model local UI state in the inner component (see `locations/`), and per the page
  plan, third-level detail tabs are split into separate pages.
- Summary/"view all" pages are being **redesigned** (Core DataViews + date-range/comparison picker +
  Performance chart), not ported 1:1 — those belong to the report-page framework tasks
  (WOOA7S-1614/1620/1621), not this per-widget skill.
- Modifying an upstream package (`packages/data`, `packages/widgets-toolkit`, `@automattic/charts`)
  to make a widget work — don't, unless absolutely necessary. A missing hook or component is a
  separate flagged task, not part of the port diff.
- Re-implementing error handling — the shared error-handling approach is owned separately; follow
  the loading/error states the contract prescribes and don't hand-roll beyond them.
