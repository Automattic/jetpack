---
name: migrate-stats-widget
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
   STOP and prompt the user (see "Missing components" below) — do not call
   `fetchStatsProxy`/`apiFetch` from a widget, and do not invent a hook on your own.
5. **Display component** — which `packages/widgets-toolkit` component renders it (`LeaderboardChart`,
   `DonutChart`, `ComparativeLineChart`, `MetricValue`/`MetricWithComparison`, etc.). If none fits,
   STOP and prompt the user (see "Missing components" below) before building anything new.
6. **Attributes (settings)** — the user-configurable fields (date range comes from the dashboard
   via `reportParams`, NOT an attribute). Typical: `num`/`max` (row count), a view/post-type
   selector. Each declared attribute MUST be consumed in `render.tsx` — no ghost attributes.

## Missing components — STOP and prompt the user

If the port needs something that doesn't exist upstream yet — a missing `packages/data` hook or
query, a missing `widgets-toolkit` display component, or missing functionality in either (or in
`@automattic/charts`) — **do not build it inline and do not silently fold it into the port.** Pause
and prompt the user with:

- **What's missing** — the specific hook / component / capability, and where you looked to confirm
  it doesn't already exist (the data-hooks list, the toolkit `index.ts`, `helpers/`).
- **Why it's needed** — what the widget can't do without it, tied to the source module's behavior
  and the reference screenshot.
- **Proposed spec** — name; inputs/props or query params; return shape; and where it should live
  (`packages/data` vs `widgets-toolkit` vs `@automattic/charts`). For a data hook, the proxy
  endpoint/prefix it would use (see AGENTS.md data proxy).

Wait for the user's decision before writing any upstream code — they may route it to a separate
task/PR, refine the spec, or approve adding it. Adding upstream pieces unprompted — even small
ones — is not allowed.

## Steps

### 1. Confirm the Linear task and base branch

This widget likely already has a subtask under **WOOA7S-1458** (Port Jetpack Stats cards and
widgets). Find it, **assign it to yourself and set it In Progress** so it's clear it's picked up,
and note which page task(s) in **WOOA7S-1612** (the per-tab ownership parent) compose it — those
are blocked by this work.

Branch off **trunk** — and **verify the base is actually `origin/trunk`, not another feature
branch**:

```bash
git fetch origin trunk
git checkout -b add/<issue-id>-<slug> origin/trunk
git diff origin/trunk...HEAD --stat   # MUST be empty before you start
```

(Dogfooding bit me here: a branch silently cut from another feature branch dragged that branch's
commits into the PR. The three-dot diff is empty only when your base is clean trunk.) One widget =
one branch = one draft PR; name the branch after this issue's ID.

### 2. Pick the data hook (do not reinvent)

`packages/data/` already has a typed hook for essentially every Stats module. List them and match:

```bash
grep -rhoE 'export (function|const) (useStats[A-Za-z]+)' projects/packages/premium-analytics/packages/data/src | sort -u
```

**The return shape is NOT uniform — open the hook and confirm before destructuring.**

- **Time-series report hooks** (built on `useStatsReport`, e.g. `useStatsTopPosts`,
  `useStatsLocations`) return `{ primary, comparison, hasComparison, isLoading, isError }`. Reach
  list data via `const items = (primary.data as StatsNormalizedReport<StatsXxxItem>)?.data?.[0]?.items ?? []`.
- **Non-time-series hooks** (built on `useStatsQuery`, e.g. `useStatsFollowers`) return the raw
  TanStack result `{ data, isLoading, isError }` — there is **no** `primary`/`comparison`. Reach data
  via `const report = data as StatsNormalizedReport<StatsXxxItem> | undefined`. Do not force a
  `{ primary }` shape onto these, and do not "fix" the hook to add one — followers/subscribers have
  no comparison period by design (this was a real bug + wrong-fix during dogfooding).

When unsure, read the hook source and `use-stats-report.ts` vs `use-stats-query.ts`. Date-range →
`period`/`end_date`/`days` conversion is done inside the query factory — never in the widget. If the
module needs local mode/filter state (geo mode, view type), wrap the data hook in a small
`use-<slug>-view.ts` hook like `locations/use-location-views.ts`.

### 3. Pick the display component (do not reinvent)

List toolkit exports and reuse helpers (`flagUrl`, `calculateDelta`, `formatLegendLabels`) before
writing your own:

```bash
sed -n '1,80p' projects/packages/premium-analytics/packages/widgets-toolkit/src/index.ts
ls projects/packages/premium-analytics/packages/widgets-toolkit/src/helpers/
```

### 4. Scaffold the folder

Create `widgets/<slug>/` with exactly these files (copy the reference ports' structure — don't use
the legacy `sales-by-coupon`/`sales-by-utm` widgets under `packages/widgets-toolkit/src/widgets/`
as templates):

- `package.json` — workspace pkg; internal deps via `link:` and the `@jetpack-premium-analytics/*`
  alias (NEVER `@automattic/jetpack-premium-analytics-*`). Dependencies must mirror imports exactly.
- `widget.json` — `name: jpa/<slug>`, `title`, `description`, `category`, `presentation`
  (`framed` | `content-bleed` | `full-bleed`). This is the source of truth for `presentation`.
- `widget.ts` — default export `{ name, title, icon, attributes?, example? }`; export the
  attribute TS type once. Do NOT declare `presentation` here.
- `render.tsx` — two-component split. Outer is `WidgetRenderProps<T>` (default `attributes = {}`)
  wrapping `<WidgetRoot>`; inner does the data work. Import the attribute type from `./widget`; never
  redeclare it. Two patterns exist — match the reference closest to your data:
  - WC / time-series widgets that consume the dashboard date range: pass
    `<WidgetRoot attributes={attributes}>` and have the inner read `useWidgetRootContext()` for
    `reportParams` (compose the render type with `Partial<ReportParamsFieldAttributes>`).
  - Stats widgets with no date range (e.g. `top-posts`, followers/subscribers): wrap `<WidgetRoot>`
    and **prop-drill** `attributes` to the inner component — the WC-shaped `reportParams` context
    doesn't fit these queries. Mirror `top-posts` exactly.
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
- **Title is host chrome — do NOT render your own heading.** The dashboard renders the widget's
  `title` + `icon` (from `widget.json` / `widget.ts`) as the card header (an `<h3>` inside
  `widgetChrome`). A body heading duplicates it — verified on the live dashboard during dogfooding.
  The body renders content only. (If the card's visible title must differ from the gallery title,
  raise it rather than adding a second heading.)
- **Dates: use `date-fns`** for all date math/formatting — never hand-roll `new Date()` arithmetic.
  Reusable date helpers (relative "since", ranges, tz) belong in
  `projects/packages/premium-analytics/packages/datetime` (it already wraps date-fns: `date.ts`,
  `tz.ts`, presets). Check there first and add to it rather than duplicating a formatter per widget.
- Counts: `dataFormat={{ type: 'number', options: { useMultipliers: true, decimals: 0 } }}`; 36px
  rows; pass `emptyStateText` to the chart instead of a `data.length === 0` branch.
- Every user-visible string through `__( …, 'jetpack-premium-analytics' )`; comments in English;
  `<button type="button">` for non-submit actions.

### 6. Register the Storybook root (once per repo)

Ensure `projects/packages/premium-analytics/widgets` is in
`projects/js-packages/storybook/storybook/projects.js` (per-widget folders auto-discover after).

### 7. Audit and lint — iterate until clean

- Run `/widget-audit <slug>` and fix every reported violation.
- `npx eslint projects/packages/premium-analytics/widgets/<slug>` (confirms the JSDoc `props` tag,
  CSS tokens, button types, etc.). Re-run until clean.

### 8. Verify it renders in Storybook (preliminary)

Build the package and check Storybook for all three stories (Default, WithComparison, dashboard):

```bash
jetpack build packages/premium-analytics
```

Compare the Default story against the reference screenshot — layout, metric, labels, empty state,
and comparison delta. This is necessary but **not sufficient**: a widget can render in Storybook and
still be missing or broken in the real dashboard. Step 9 is the check that actually counts.

### 9. Verify on the live dashboard — REQUIRED (the step that proves it works)

A widget is not done until it works in the real Premium Analytics dashboard. Do not skip this and do
not open a PR without it.

1. **Build the plugin** that hosts the dashboard:

   ```bash
   jp build plugins/premium-analytics --deps
   ```

   The dashboard lives in the standalone `plugins/premium-analytics` plugin, and `--deps` builds its
   `packages/premium-analytics` dependency in the same pass — required here (this is the documented
   exception to the usual "don't pass `--deps`" rule). On failure: read the error, fix what's
   diagnosable, retry once, then escalate.
2. **Bring up the env** via the `jetpack-dev-env` skill (auto-detects the agent from pwd). Require
   HTTP 200 on `/` **and** on the dashboard URL below before continuing; on 5xx, tail
   `wp-content/debug.log` and check active source-mounted plugins (see `jetpack-address-issue`
   step 5) — the usual cause is another mounted plugin that needs a build.
3. **Open the dashboard** with the chrome MCP browser tooling (against
   `https://jp-<agent>.jurassic.tube/` or `localhost:<port>`), creds `wordpress` / `<DEV_ADMIN_PASS>`:

   ```text
   /wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin
   ```

4. **Add and exercise the widget** — the test procedure:
   - Click **Customize** on the dashboard/section the widget is registered to (its `category`).
   - Find the widget in the **gallery** (by its `title`).
   - **Add it to the dashboard.**
   - Confirm the **visual is correct** — matches the reference screenshot, data actually loads (not
     stuck in loading / empty / error).
   - **Watch the browser console** the whole time — there must be **no errors and no noisy warnings**
     (React key/act warnings, failed fetches, missing `--wpds-*` tokens, etc.).
   - **Resize / move (cannot be automated):** the dashboard grid uses a custom pointer-sensor that
     only responds to *trusted* native input, and the chrome MCP exposes no native coordinate-drag
     (HTML5 element-drag, keyboard DnD, and synthetic pointer events all fail to trigger it). Do not
     burn time trying — note in the PR that resize/move was not automatable and either skip it or ask
     the user to drag once manually. Everything else above IS automatable and required.
5. **Bug-fix loop (autonomous, no check-ins):** if the widget is absent from the gallery, renders
   broken, throws on add, or spams the console — examine and fix, rebuild the affected layer
   (re-run the relevant part of step 1), and re-run this whole verification. Loop until every check
   passes. Escalate only if the fix needs a missing upstream piece (see "Missing components") or a
   meaningfully different approach.
6. **Screenshot the working widget** once it passes. Attach it to the PR with the
   **`jetpack-screenshot-local`** skill, which uploads to GitHub's user-attachments CDN and posts it
   on the PR so it renders inline forever. **Do NOT create `screenshots/*` git branches/refs** — use
   the uploader. A widget port is a **new addition**, so capture an **"after" only** (before/after
   pair only when you changed an *existing* widget).

Do not proceed until the dashboard verification passes with a clean console.

### 10. Local review loop — gate the push

Before anything reaches the remote, run the pre-push review gate (`/native-review-loop`) to catch
widget-contract violations and scope creep locally — before CI burns a run and before review churn
on the PR. Spawn an independent fresh-context reviewer on the local diff, triage + fix valid
findings, re-verify, and re-review with a new reviewer until a **clean pass** (no blocker/should-fix).
Run **at most 3 rounds, and stop as soon as a round comes back clean** — don't keep spawning
reviewers once it's clean. Point the reviewer at `AGENTS.md`, `.agents/rules/widgets.md`, and
`widget-audit.md` as the contract. Do not push while blockers remain.

### 11. Open the PR — with the dashboard screenshot

- Add a changelog entry (`/jetpack-changelog`) and open the PR via `/jetpack-pr` (off trunk, full
  template preserved). Attach the **"after"** dashboard screenshot from step 9 via
  **`jetpack-screenshot-local`** (uploads to PR user-attachments) — **not** a `screenshots/*` branch.
  After-only for a new widget; before/after only when changing an existing one. Assign it to the
  issue owner.
- All CI workflows must pass — fix anything that's red before handing off.
- Hand off to the `jetpack-pr-review-cycle` skill with the new PR number.

## Done criteria

- `/widget-audit <slug>` and `eslint` both pass.
- All three stories render; Default visually matches the screenshot; WithComparison shows real
  previous-period deltas.
- **The widget was added to a live dashboard at
  `/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin`, looks correct, and produces no
  console errors or noisy warnings** (step 9 — the load-bearing check). Resize/move is not
  automatable (custom pointer-sensor); don't gate on it.
- The data hook is from `packages/data` (no direct proxy/apiFetch); display is a toolkit component;
  no reinvented helpers; no upstream package changed **except** a component/hook the user approved
  via the Missing-components flow.
- A PR is open off trunk (verified clean base — three-dot diff is just this widget, no stray
  commits) with the "after" dashboard screenshot and passing CI.
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

- Putting the **registered** widget folder (`package.json` + `widget.json` + `widget.ts` +
  `render.tsx`) anywhere but top-level `widgets/<slug>/`. (`packages/widgets-toolkit/src/widgets/*`
  is a different thing — reusable composite widget *components* you compose from, like
  `OrderMetricWidget` / `SalesByDeviceWidget`; only the older registered widgets there —
  `sales-by-coupon`, `sales-by-utm` — are legacy, so just don't copy those as templates.)
- Declaring `presentation` in `widget.ts`, or re-declaring the attribute type in `render.tsx`.
- Dropping `attributes` at the `<WidgetRoot>` boundary (kills date/comparison controls).
- A `withComparison` story control not wired into `reportParams: getDefaultQueryParams(withComparison)`
  → reviewers get a false comparison test.
- Modules with internal tabs or drill-down (Locations, UTM, Devices, Post detail) are NOT single
  flat widgets — model local UI state in the inner component (see `locations/`), and per the page
  plan, third-level detail tabs are split into separate pages.
- Summary/"view all" pages are being **redesigned** and are **not** registered widgets. Each is a
  page-level composition that *expands* the corresponding dashboard module — date-range/comparison
  picker + Performance chart + a Core DataViews records table — reusing the module's **data hook**,
  not the widget. They belong to the report-page framework tasks (WOOA7S-1614/1620/1621), not this
  per-widget skill. Don't build a report/summary page as a `jpa/` widget.
- Silently adding to or modifying an upstream package (`packages/data`, `packages/widgets-toolkit`,
  `@automattic/charts`) to make a widget work. If you find a missing hook, component, or piece of
  functionality, **STOP and prompt the user** — see "Missing components" below. Never fold new
  upstream pieces into the port diff on your own.
- Re-implementing error handling — the shared error-handling approach is owned separately; follow
  the loading/error states the contract prescribes and don't hand-roll beyond them.
