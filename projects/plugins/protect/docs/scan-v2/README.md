# Protect Scan v2 — RFC

This folder holds the design and implementation plan for migrating Protect's Scan tab onto the new dataviews-based UI shipped in [#48458](https://github.com/Automattic/jetpack/pull/48458).

## Documents

- [design.md](./design.md) — full design spec. Architecture (Approach C), REST surface, JS shell, threat-list wiring, modals, header CTA, free-tier upsell, Tracks events, locked decisions, adversarial-review log.
- [plan-stage1.md](./plan-stage1.md) — bite-sized task list for the Stage 1 PR (introduce v2 behind a feature flag, no legacy removal). Stage 2 plan to be drafted as a follow-up after Stage 1 ships.

## TL;DR

- **What:** Replace Protect's accordion-based threat list with `ThreatsDataViews` (the new component used by the wp-admin Scan submenu). Active/History live as an in-table status filter, not outer tabs. Free tier sees an upsell card via the `empty` slot. WAF, Account Protection, Settings, Setup are untouched.
- **How:** Approach C — reuse the `/jetpack/v4/site/scan/*` REST bridges already registered by `packages/scan` (after a narrow filter-ungate change), recreate the JS layer inside Protect at `routes/scan/v2/`. Reuse `ThreatsDataViews` from `@automattic/jetpack-scan` as the only shared JS atom.
- **Rollout:** Two-stage. Stage 1 adds the v2 tree behind `JETPACK_PROTECT_SCAN_V2` PHP constant and `?protect-scan-v2=1` URL flag. Stage 2 flips the default and deletes the legacy code.

## Status

Design and Stage 1 plan ready for review. Stage 2 plan TBD after Stage 1 lands.

## Related

- Tracking issue: [#48456](https://github.com/Automattic/jetpack/issues/48456)
- Reference port: [#48458](https://github.com/Automattic/jetpack/pull/48458)
- UI Modernization umbrella: [#48160](https://github.com/Automattic/jetpack/issues/48160)
