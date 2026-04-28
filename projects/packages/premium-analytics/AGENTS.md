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

- **Phase 1** (`tasks/dashboard-more-charts.md`): UI-only, hardcoded mock data.
  No data fetching is permitted.
- **Phase 2** (`tasks/dashboard-real-data.md`): Consume `GET /jetpack/v4/stats/blog`
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

Run `/premium-analytics:add-route` for the required steps.

---

## Definition of done (build-sensitive changes)

- [ ] Build succeeds
- [ ] App opens in `wp-admin` without blank screen
- [ ] Route navigation works
- [ ] No shim-dependent regression

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
