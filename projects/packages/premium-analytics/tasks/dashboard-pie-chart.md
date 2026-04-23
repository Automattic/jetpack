# Task: Dashboard Pie Chart (Mock Data)

## What

Add a pie chart to the existing dashboard route using mock data.
This is a UI-only change — no data fetching, no endpoints, no stores.

## Scope

You may only touch:

- `routes/dashboard/stage.tsx`
- `routes/dashboard/package.json` (only if a dependency needs to be added)
- `package.json` at the package root (only if a dependency needs to be added)

Do not create new routes, new packages, or new files outside this directory.

## Implementation

Use `PieChart` from `@automattic/charts`:

```ts
import { PieChart } from '@automattic/charts';
import type { DataPointPercentage } from '@automattic/charts';
```

The chart must use hardcoded mock data of type `DataPointPercentage[]`:

```ts
const DATA: DataPointPercentage[] = [
  { label: 'Direct', value: 4200 },
  { label: 'Search', value: 3100 },
  { label: 'Social', value: 1800 },
  { label: 'Referral', value: 900 },
];
```

Render the chart inside `stage()` below the existing heading.
Use the `size` prop to set a fixed diameter (e.g. `size={ 300 }`).
Use `withTooltips` prop.

## Why PieChart, not LineChart

`PieChart` uses a `size` prop to control its diameter directly.
This avoids the ResizeObserver feedback loop that occurs when a chart
measures its parent container and the parent has no fixed height.

## Constraints

- Mock data only — do not fetch, do not invent endpoints or stores
- Do not claim these are real analytics metrics in any UI copy
- Do not modify anything outside `routes/dashboard/` and the package root `package.json`
- Do not edit files in `build/`

## Definition of Done

- [ ] Chart renders in `wp-admin` without blank screen or console errors
- [ ] Mock data is visible as a pie chart
- [ ] Tooltip appears on hover
- [ ] Chart does not resize infinitely
- [ ] Build succeeds
- [ ] No changes outside allowed scope

## Submitting

1. Create a new branch from the current branch:
   ```bash
   git checkout -b add/premium-analytics-dashboard-pie-chart
   ```
2. Add a changelog entry:
   ```bash
   pnpm jetpack changelogger add packages/premium-analytics --significance=patch --type=added --entry="Analytics: Add pie chart with mock data to dashboard route"
   ```
3. Commit all changes including the changelog entry.
4. Push the branch and open a **draft PR** against `trunk`.
5. PR description must include the Session Report below.

## Session Report

Fill this out in the PR description:

```
## Agent Session Report
- Scope respected: yes / no
- Escalations triggered: N
- Contract violations: none / [describe]
- Human rework needed: none / minor / major
```
