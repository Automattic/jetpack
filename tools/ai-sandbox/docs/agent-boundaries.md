# Agent Boundaries for Premium Analytics

This document defines what AI agents may and may not change inside
`projects/packages/premium-analytics`.

## Purpose

`premium-analytics` is currently a full-page SPA rendered inside `wp-admin`.
The package bootstraps through `wp-build`, `@wordpress/boot`, and route-based
code splitting. Agents must preserve those runtime assumptions.

## Allowed Changes

Agents MAY:

- add or modify route modules under `routes/**`
- update UI code in `routes/**/stage.tsx`
- update package-local initialization code under `packages/init/**`
- update `src/class-analytics.php` when preserving the page boot contract
- add package-local docs, tests, and non-generated source files
- refine copy, localization calls, and presentational components

## Restricted Changes

Agents MUST NOT, without explicit human approval:

- change the page id `jetpack-premium-analytics`
- change the admin page slug `jetpack-premium-analytics`
- remove the boot asset shim copy step from package build scripts
- delete or bypass `packages/init/` if boot dependency tracking still relies on it
- edit generated files inside `build/`
- introduce new backend data contracts that are not documented first
- assume undocumented REST endpoints, stores, selectors, or analytics schemas exist
- modify cross-package or monorepo-wide build behavior from this package alone

## Required Preservation Rules

Agents MUST preserve the following invariants:

1. The package remains a full-page SPA in `wp-admin`.
2. Route discovery continues to happen via route metadata in `package.json`.
3. The PHP entry continues loading the generated build entry when present.
4. The admin menu page remains booted by the build/runtime path rather than by a custom PHP page renderer.
5. Sidebar items must correspond to actual route paths.

## Escalate to Human Review When

Agents MUST stop and request human review before:

- changing page identity, slug, or boot sequence
- changing build/runtime dependency assumptions around `@wordpress/boot`
- removing the shim workaround
- introducing data fetching or persistence layers
- adding analytics semantics such as metric definitions, aggregation rules, or retention behavior
- changing permissions or capability requirements
- changing integration points with other Jetpack packages

## Generated Artifacts

`build/` is generated output and must never be manually edited.
Agents should change source files and rebuild instead.

## Safe Default

If an agent is unsure whether a change affects runtime bootstrapping,
route discovery, or admin page registration, it must not proceed automatically.
