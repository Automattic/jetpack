# AGENTS.md — premium-analytics

This file is authoritative. Read it fully before making any changes.

---

## What this package is

A full-page SPA rendered inside `wp-admin`. Boot chain:

1. `src/class-analytics.php` — PHP entry, registers admin page and enqueues build output
2. `build/build.php` (generated) — registers boot and interceptor behavior
3. `@wordpress/boot` — provides the full-page shell
4. Routes discovered from `route` metadata in each `routes/*/package.json`, lazy-loaded

**Do not break this chain.**

---

## Current file structure

```
src/class-analytics.php        PHP entry point
shims/boot-asset.php           compatibility shim — DO NOT remove
packages/init/src/index.ts     boot-time initialization (icon, menu state)
routes/dashboard/              the only route so far
  package.json                 route metadata
  stage.tsx                    route component
build/                         generated — never edit manually
```

---

## Allowed without approval

- Add or modify routes under `routes/**`
- Edit `routes/**/stage.tsx`
- Edit `packages/init/**`
- Edit `src/class-analytics.php` while preserving the page boot contract
- Add docs, tests, non-generated source files
- Refine copy and localization strings
- Consuming **existing** Jetpack REST endpoints via `@wordpress/api-fetch` in route components or `packages/` modules
- Creating new data packages under `packages/` that only consume existing endpoints (no new PHP contracts)

---

## Requires human approval

- Changing page id `jetpack-premium-analytics`
- Changing admin page slug `jetpack-premium-analytics`
- Removing or modifying the shim copy step in build scripts
- Removing or bypassing `packages/init/`
- Changing `@wordpress/build`, `@wordpress/boot`, or `@wordpress/route` versions
- Introducing **new** backend REST endpoints or data contracts (new PHP routes, new XMLRPC methods)
- Introducing new `@wordpress/data` stores that are shared across routes or packages
- Modifying cross-package or monorepo-wide build behavior

---

## Phased data work

The dashboard is being built in two phases:

- **Phase 1**: UI-only, hardcoded mock data. No data fetching is permitted.
  Individual chart / settings tasks are tracked in Linear, not as task md
  files in this repo (see "Linear issue contract" section below).
- **Phase 2** (task not yet written): Consume `GET /jetpack/v4/stats/blog`
  (already registered by `projects/packages/stats/`).
  Route-local `useStats()` hook via `@wordpress/api-fetch` is allowed.
  Do not register new endpoints or shared stores without approval.

**Boundary rule:** "existing endpoint" means the route is already registered in PHP
and documented in `projects/packages/stats/`. Calling an undocumented or new path
requires human approval.

---

## Never do

- Edit anything inside `build/`
- Invent endpoints, stores, selectors, event models, metrics, or feature flags
- Write UI copy that implies analytics data or premium features exist when they do not

---

## Adding a route

@docs/add-route.md

---

## Definition of done

**Agent-verifiable (required before push):**
- [ ] Build succeeds
- [ ] UI verification passes: run `/premium-analytics-verify-ui` inside `jetpack-ai-sandbox` and confirm the Analytics dashboard mounts without uncaught JS exceptions

**Human-verifiable (PR review):**
- [ ] Route navigation works
- [ ] No shim-dependent regression

---

## After opening a PR

Run the review cycle after the PR is opened to request Copilot review, address feedback, and keep the branch rebased on fresh trunk:

```bash
/jetpack-pr-review-cycle
```

---

## PR review workflow

When asked to address PR feedback, fetch unresolved comments directly — do not wait for the user to paste them:

```bash
gh api repos/Automattic/jetpack/pulls/<PR>/comments
gh api repos/Automattic/jetpack/pulls/<PR>/reviews
```

Address all open comments, commit, and push. Then leave a summary comment on the PR listing what was changed.

---

## Stop and ask a human when

- Unsure whether a change affects boot sequence, route discovery, or admin page registration
- Any change to page identity, slug, or `@wordpress/boot` assumptions
- Introducing data fetching that targets an endpoint NOT listed in `projects/packages/stats/`
- Introducing a `@wordpress/data` store shared across more than one route
- Any persistence, write operations, or analytics event tracking

---

## Common patterns and pitfalls

Invariants discovered through implementation that the next agent should
know up front, so individual task issues don't re-explain the rationale.

### `@automattic/charts` usage

- **Use `*Unresponsive` chart variants** (`PieChartUnresponsive`,
  `LineChartUnresponsive`, etc.) when the parent container does not have
  a fixed height. The responsive wrappers use `withResponsive` +
  `useParentSize` to measure their parent, which feedback-loops with
  `ChartLayout`'s internal `ResizeObserver` and causes infinite vertical
  growth.

- **`withTooltips` prop is required** if hover/tooltip Playwright specs
  are part of the task's DoD. Without it the chart skips its mouse
  handlers, the tooltip portal never renders, and any spec that hovers
  + asserts on `.visx-tooltip` content (e.g.
  `expect(tooltip).toBeVisible()`) fails because the element it's
  waiting for never appears.

- **CSS subpath import is required**: `import '@automattic/charts/style.css';`
  must be present in the route that renders the chart. The package does
  not auto-inject styles. Without it, `ChartLayout`'s `ResizeObserver`
  measures inline-SVG descender space and the chart height drifts
  upward on each cycle.

- **No `eslint-disable` directive on the CSS import.** Write the import
  bare — `import '@automattic/charts/style.css';` with no trailing
  comment. The repo's `import/no-unresolved` config does not fire on
  CSS subpath imports (the TypeScript import resolver only resolves
  JS-like extensions, so CSS files are outside its purview),
  *regardless* of whether the resolved `dist/index.css` is present on
  disk locally. A disable directive here is always reported as unused
  by ESLint's default `reportUnusedDisableDirectives` and stripped by
  pre-commit `lint-file --fix` on every commit — including
  directive-only follow-up commits, which then land empty. The 6-round
  forensic trail lives in
  [`docs/research/eslint-disable-line-discovery.md`](docs/research/eslint-disable-line-discovery.md).

### ESLint patterns

`@automattic/charts/style.css` is a subpath export with two resolution
paths (`projects/js-packages/charts/package.json`):

```json
"./style.css": {
  "jetpack:src": "./src/style.css",   // monorepo consumers
  "default":     "./dist/index.css"    // published package
}
```

Earlier rounds of this research only considered the `default` path and
assumed `import/no-unresolved` fires on the import (because `dist/index.css`
is gitignored and not built during ESLint CI), and therefore that a
disable directive was needed. That premise was wrong on two counts: even
within the monorepo, the `jetpack:src` condition would have resolved to
the *committed* `src/style.css` regardless of whether `dist/` was built.
More fundamentally, the host dogfood for
[RSM-3726](https://linear.app/a8c/issue/RSM-3726) falsified the whole
chain: the rule never fires on this import at all.

Why: the repo's import-resolver config
(`tools/js-tools/eslintrc/base.mjs:251-266`) wires
`eslint-import-resolver-typescript`, and that resolver only handles
JS-like extensions (`.ts/.tsx/.js/.jsx/...`). CSS subpath imports are
outside its purview; `import/no-unresolved` simply does not evaluate
them. Confirmed empirically by running
`pnpm run lint-file projects/packages/premium-analytics/routes/dashboard/stage.tsx`
against both filesystem states (with `dist/index.css` present and with
it moved aside) — exit 0, no warnings in both.

Practical consequence: any `eslint-disable-line import/no-unresolved`
comment on this import is genuinely *unused*. ESLint 9's default
`linterOptions.reportUnusedDisableDirectives` reports unused disable
directives as warnings, and pre-commit `lint-file --max-warnings=0
--fix` autofixes them — the comment gets stripped on the initial
commit AND on a directive-only follow-up commit (verified on the
RSM-3726 dogfood where the follow-up landed empty). The relevant warning text from
`pnpm run lint-file` (full output reproduced in
`docs/research/eslint-disable-line-discovery.md` → Round 6):

```
projects/packages/premium-analytics/routes/dashboard/stage.tsx
  2:40  warning  Unused eslint-disable directive
        (no problems were reported from 'import/no-unresolved')
✖ 1 problem (0 errors, 1 warning)
  0 errors and 1 warning potentially fixable with the `--fix` option.
```

This rules out the Round 4 conclusion that
`reportUnusedDisableDirectives` was not the mechanism — the option is
enabled by default in ESLint 9 regardless of whether any config
explicitly sets it.

**Operational rule:** write the import bare. Do not add a disable
directive; do not run a post-commit verification step; do not open a
follow-up commit to re-add the directive. The previous "verify after
commit, re-add if missing" rule is retired.

### `@wordpress/boot` shim

`shims/boot-asset.php` is a compatibility shim copied into
`build/modules/boot/index.min.asset.php` during build. **Do not remove
or modify the shim copy step** — without it the boot chain fails to
register the admin page.

---

## Linear issue contract for `/premium-analytics-implement-task`

This package's `tasks/` directory is gone. Tasks live in Linear issues.

**Today (Phase 1):** the implement-task skill takes a path to a local
scratch md file (see the skill's "Input" section for the exact call
signature). A human translates the Linear issue description into that
scratch file before invoking the skill.

**Future (Phase 2, RSM-3707, not yet landed):** the skill will read the
Linear issue body directly via MCP; no scratch file needed.

The contract below applies to the issue description in both phases —
in Phase 1 it doubles as the scratch file's contents; in Phase 2 the
skill consumes it straight from Linear.

### Required

1. **What** — 1-3 sentences: current state → end state.
2. **Scope** — bulleted list of files the implementation may touch
   (paths relative to repo root). The skill enforces this as the single
   source of truth for what the task may modify.
3. **Implementation** — what to add or change, with the exact code /
   values where they matter. Reasoning for non-obvious choices should
   link back to the relevant section in this AGENTS.md, not be inlined.
4. **Definition of done** — two sub-lists:
   - *Agent-verifiable* — build, `/premium-analytics-verify-ui`, any
     regression-injection acceptance items.
   - *Human-verifiable* — visual / functional checks for PR review.
5. **Submitting** — branch name to create (e.g. `add/<topic>`) and the
   exact `pnpm jetpack changelogger add` command + entry.

### Recommended

- A short "Background" or "Why" paragraph if the task isn't
  self-explanatory.
- Links to related Linear issues / RFCs / Slack threads.

### What NOT to include

- **Implementation rationale.** Reasoning about *why* a particular
  library / API / pattern is being used is an invariant; it belongs in
  the "Common patterns and pitfalls" section above (so all task issues
  benefit, not just this one). If the rationale doesn't exist there
  yet, capture it during implementation via Step 10 of the
  implement-task skill.
- **Boilerplate constraints** that apply to every task in this package
  (no real endpoints in Phase 1, no `build/` edits, etc.). They live in
  the "Allowed without approval" / "Never do" sections above.
- **Session Report** template content. The skill fills that in
  automatically when it opens the PR.
