# CLAUDE.md — premium-analytics

This file is authoritative. Read it fully before making any changes.

Detailed rationale for every rule here lives in the monorepo docs:
- `docs/agent-boundaries.md`
- `docs/build-runtime-contract.md`
- `docs/ui-scope-contract.md`
- `docs/route-contract.md`

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

---

## Requires human approval

- Changing page id `jetpack-premium-analytics`
- Changing admin page slug `jetpack-premium-analytics`
- Removing or modifying the shim copy step in build scripts
- Removing or bypassing `packages/init/`
- Changing `@wordpress/build`, `@wordpress/boot`, or `@wordpress/route` versions
- Introducing new backend data contracts, REST endpoints, stores, or selectors
- Modifying cross-package or monorepo-wide build behavior

---

## Never do

- Edit anything inside `build/`
- Invent endpoints, stores, selectors, event models, metrics, or feature flags
- Write UI copy that implies analytics data or premium features exist when they do not

---

## Adding a route

1. Create `routes/<name>/`
2. Add `package.json` with:
   ```json
   {
     "private": true,
     "name": "_@jetpack-premium-analytics/<name>-route",
     "route": {
       "path": "/<path>",
       "page": "jetpack-premium-analytics"
     }
   }
   ```
3. Add `stage.tsx` exporting `stage()`
4. Run build
5. Verify route loads in `wp-admin` without blank screen
6. Add sidebar entry only if path matches an existing route

---

## Definition of done (build-sensitive changes)

- [ ] Build succeeds
- [ ] App opens in `wp-admin` without blank screen
- [ ] Route navigation works
- [ ] No shim-dependent regression

---

## Stop and ask a human when

- Unsure whether a change affects boot sequence, route discovery, or admin page registration
- Any change to page identity, slug, or `@wordpress/boot` assumptions
- Introducing any data fetching, persistence, or analytics semantics
