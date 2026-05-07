# Protect: adopt new Scan dataviews UI

**Date:** 2026-05-07
**Status:** Design — pending parallel review
**Owner:** ilona
**Related:** [#48456](https://github.com/Automattic/jetpack/issues/48456) (Scan port tracking issue), [#48458](https://github.com/Automattic/jetpack/pull/48458) (merged Scan port), [#48160](https://github.com/Automattic/jetpack/issues/48160) (UI Modernization umbrella)
**Reference:** Figma `IA - UI Unification` node `6171-87963` (designer-approved Protect-Scan-tab mockup)

## Goal (from user perspective)

> The Scan UI shipped in PR #48458 should become the body of Protect's existing **Scan tab**, replacing the current accordion-based threat list. Other Protect tabs (Firewall, Account Protection, Settings, Setup) and free-vs-paid plan/upsell logic stay in place.

## Non-goals

- Touching Firewall, Account Protection, Settings, or Setup routes
- Deprecating the legacy `jetpack-protect/v1/*` REST surface (issue #48456 decision #5 — follow-up PR)
- Codeable upsell inside view-details modal (decision #4 — follow-up)
- SVG illustration cleanup (decision #7 — follow-up)
- Server-side WPCOM scan-plan gating (out of scope; inherited)

## Architecture (Approach C: reuse REST, recreate JS in Protect)

### Approaches considered

| | Approach A | Approach B | **Approach C (chosen)** |
|---|---|---|---|
| **PHP REST** | New controller in Protect duplicating Phase 1 + Phase 3 routes | Reuse `packages/scan` controller (decoupled from filter) | Reuse `packages/scan` controller (decoupled from filter) |
| **JS data layer** | Owned in Protect, mirrors `packages/scan/src/js/data/` | Imported from `@automattic/jetpack-scan-page` | Owned in Protect, mirrors `packages/scan/src/js/data/` |
| **JS screens** | Owned in Protect | Imported from `@automattic/jetpack-scan-page` | Owned in Protect |
| **JS atoms** | `@automattic/jetpack-scan` (already a dep) | `@automattic/jetpack-scan` | `@automattic/jetpack-scan` |
| **Coupling** | None — fully isolated | High — Protect couples to a `-page` package | Low — only the REST contract is shared |
| **Maintenance** | Bridges + screens duplicated | Single source of truth | Bridges shared, screens duplicated |
| **Risk** | None to `packages/scan` | Elevates `-page` to library API | Single narrow change to `packages/scan` (REST ungate) |

### Why C

1. The PHP bridges are pure WPCOM proxies with no business logic. Two copies is future drift; one copy is correct. Phase 1's filter-gate on REST is collateral — the filter's actual purpose is gating the wp-admin **submenu**, not the REST routes.
2. The JS screens have real shape divergence between Protect and Scan: Protect is a HashRouter SPA inside its own `ProtectApp`/`AdminPage`; `packages/scan` mounts at a top-level wp-admin submenu. `HeaderActionsProvider`, `AdminPage` chrome, mock-mode flag, and route shape all diverge enough that "share the screens" leaks abstractions. Better that Protect own its glue.
3. C lets Protect's tab migrate without touching `packages/scan`'s public API or release cadence. We touch `packages/scan` once, narrowly, to ungate REST registration.

## Design

### 1. PHP — narrow change in `packages/scan`

Verified `class-jetpack-scan.php:75–98`: the current `initialize()` early-returns on `! apply_filters( MODERNIZATION_FILTER, false )` and so blocks `load_wp_build()`, `fix_boot_import_map_ordering()`, `bridge_wp_build_enqueue()`, `admin_menu`, `rest_api_init`, the `jetpack_package_versions` filter, and the terminal `do_action( 'jetpack_scan_page_initialized' )` together. The split has to be explicit — not just "remove the early return":

```php
public static function initialize() {
    if ( did_action( 'jetpack_scan_page_initialized' ) ) {
        return;
    }

    // REST routes register unconditionally — they're pure WPCOM proxies and Protect
    // (and any future modernization consumer) needs them regardless of the admin-UI flag.
    add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );

    // The new wp-admin Scan page is gated by the modernization filter.
    if ( (bool) apply_filters( self::MODERNIZATION_FILTER, false ) ) {
        self::load_wp_build();
        self::fix_boot_import_map_ordering();
        self::bridge_wp_build_enqueue();
        add_action( 'admin_menu', array( __CLASS__, 'add_wp_admin_submenu' ) );
        add_filter( 'jetpack_package_versions', array( Package_Version::class, 'send_package_version_to_tracker' ) );
    }

    do_action( 'jetpack_scan_page_initialized' );
}
```

`do_action( 'jetpack_scan_page_initialized' )` continues to fire whether the admin UI is gated or not — listeners that care about REST availability stay correct; listeners that care about the admin UI can re-check the filter themselves.

Add one PHPUnit test in `projects/packages/scan/tests/php/Jetpack_Scan_Bridges_Test.php` asserting routes register when the filter is `false`.

Add a changelog entry to `projects/packages/scan/changelog/` (`add` patch type).

**Verified risk:** route exposure when filter is off. `Rest_Controller::permissions_check()` requires `current_user_can( 'manage_options' )`. With that gate, exposure to non-admin users is a 403, not data leakage. Confirmed in PHP review.

### 2. PHP — Protect plugin

No new REST routes. Protect's `class-rest-controller.php` is **untouched** by this PR.

The legacy `jetpack-protect/v1/*` endpoints continue to register so other surfaces (Setup wizard) keep working. Their deprecation is a follow-up.

**User-auth check at mutation time.** Phase 3 mutations use `Client::wpcom_json_api_request_as_user`. PHP review flagged a risk: `as_user` may silently fall back to blog auth if no current user has a connection token, which would let a privileged-but-not-user-connected admin trigger writes that mis-attribute. **Mitigation in this PR:** harden `Rest_Controller::permissions_check_user()` (the callback used by mutation routes — `threat/{id}/ignore`, `threat/{id}/unignore`, `threats/fix`) to also require `( new Connection_Manager() )->is_user_connected()`. Read paths keep the existing admin-only check. Adds one test to `Jetpack_Scan_Bridges_Test`.

Initial state: Protect's existing `window.jetpackProtectInitialState` carries the REST nonce (`apiNonce` at `class-jetpack-protect.php:223`); the new client uses that. No new initial-state blob is needed. Documented in the new entry-file's module comment so the dependency is explicit.

### 3. JS — file tree

```
projects/plugins/protect/src/js/routes/scan/v2/
  index.tsx                  // QueryClientProvider + HeaderActionsProvider + ThreatsScreen + NoticesList
  data/
    fetchers.ts              // fetchSiteScan, fetchSiteScanHistory, fetchSiteScanCounts,
                             // ignoreThreat, unignoreThreat, fixThreats, fetchFixThreatsStatus, enqueueScan
    query-options.ts         // siteScanQuery, siteScanHistoryQuery, siteScanCountsQuery
    types.ts                 // re-export Threat from @automattic/jetpack-scan
    use-scan-threats-query.ts // unioned active + history Threat[] keyed off id
    use-threat-mutations.ts  // useFixThreatsMutation, useIgnoreThreatMutation,
                             // useUnignoreThreatMutation, useEnqueueScanMutation
    use-fix-threats-status.ts // 2 s polling, stops on terminal status
    use-track-event.ts       // jetpack_protect_scan_*
    mock/
      index.ts               // ?jpprotect-mock=1
      fixtures.ts             // Protect-scoped fixtures (separate from packages/scan)
  screens/
    threats.tsx              // single ThreatsDataViews instance
    fix-threat-modal.tsx     // RenderFixModal
    bulk-fix-modal.tsx       // confirm → progress → done state machine
    ignore-threat-modal.tsx  // RenderIgnoreModal
    unignore-threat-modal.tsx // RenderUnignoreModal
    view-details-modal.tsx   // RenderViewModal
    scan-now-button.tsx      // calls useEnqueueScanMutation
    scan-status.tsx          // spinner + ProgressBar; replaces threats table during enqueued/running
    empty-state.tsx          // free → Protect upsell hero; paid → "all clear"
    use-threat-actions.ts    // bundles mutations into stable callbacks
  notices-list.tsx           // <SnackbarList> mounted once for the route
```

`v2/` exists so the old code (`paid-list.jsx`, `free-list.jsx`, `pagination.jsx`, accordion components, the three legacy modal components, `ScanAdminSectionHero`, `ScanningAdminSectionHero`, `ScanButton`, `ScanRoute`/`ScanHistoryRoute`) can be deleted in one cleanup commit at the end of the PR.

### 4. Routing inside Protect's app

- `/scan` → renders `<ThreatsScreen />` from `routes/scan/v2/index.tsx` instead of the legacy `<ScanRoute />`.
- `/scan/history` → removed; HashRouter redirects to `/scan` once on first hit (handled in the route definition, not server-side).
- All other Protect routes (`/firewall`, `/settings`, `/setup`) are untouched.

### 5. Threat list — single `ThreatsDataViews` instance, status filter inside

```tsx
<ThreatsDataViews
  data={ unionOfActiveAndHistoryThreats }
  showStatusFilter={ true }                              // upstream toggle group control
  filters={ [ { field: 'status', operator: 'isAny', value: [ 'current' ] } ] }
  persistKey="jetpack-protect:scan:view"                 // unique to Protect; avoids collision with jetpack-scan:*
  onTrackEvent={ trackProtectScanEvent }
  empty={ <EmptyState /> }
  isThreatEligibleForFix={ ( t ) => Boolean( t.fixable ) }
  isThreatEligibleForIgnore={ ( t ) => t.status === 'current' }
  isThreatEligibleForUnignore={ ( t ) => t.status === 'ignored' }
  RenderFixModal={ FixThreatModal }
  RenderIgnoreModal={ IgnoreThreatModal }
  RenderUnignoreModal={ UnignoreThreatModal }
  RenderViewModal={ ViewDetailsModal }
/>
```

**Data flow.** `useScanThreatsQuery` calls TanStack Query for `siteScanQuery()` and `siteScanHistoryQuery()` in parallel. Returns:

```ts
{
  data: Threat[];           // merged, useMemo'd, deduped by id
  isLoading: boolean;       // true until BOTH queries resolve once
  isFetching: boolean;      // true if EITHER is fetching
  activeError: Error | null;
  historyError: Error | null;
  refetch: () => void;      // re-runs both
}
```

**Partial-failure UX (defined explicitly).** Three real cases:

1. **Active fails, history succeeds:** render `<ErrorState />` (full-block; "We couldn't load your threats") — active threats are the user's primary intent on this tab. Don't degrade to "history only" — that's worse than visible failure.
2. **Active succeeds, history fails:** render the merged dataset (= active rows only); fire a snackbar `"Couldn't load scan history"` with a "Retry" action that calls `historyQuery.refetch()`. The user can still see and act on current threats.
3. **Both fail:** `<ErrorState />` with "Retry" wired to the merged `refetch()`.

The status field on each row (`current` / `fixed` / `ignored`) drives the upstream toggle's client-side filter.

**Mutations.** `useFixThreatsMutation` / `useIgnoreThreatMutation` / `useUnignoreThreatMutation` / `useEnqueueScanMutation` invalidate the merged query prefix on success so both endpoints refetch.

**Scan progress takeover.** While `scanData.state` is `enqueued` or `running`, `<ScanStatus />` replaces the entire `ThreatsDataViews` block (mirrors `packages/scan` Phase 5).

### 6. Modals

Four modals, wired through the `Render*Modal` props. Old Protect components deleted in same PR:

| New (in `v2/screens/`) | Replaces | Wired via |
|---|---|---|
| `fix-threat-modal.tsx` | `protect/src/js/components/fix-threat-modal/` | `RenderFixModal` |
| `bulk-fix-modal.tsx` | `protect`'s `FIX_ALL_THREATS` modal type in `threats-list/index.jsx` | Header CTA's `<BulkFixModal />` mount |
| `ignore-threat-modal.tsx` | `protect/src/js/components/ignore-threat-modal/` | `RenderIgnoreModal` |
| `unignore-threat-modal.tsx` | `protect/src/js/components/unignore-threat-modal/` | `RenderUnignoreModal` |
| `view-details-modal.tsx` | (new — Protect today inlines threat details into the accordion row) | `RenderViewModal` |

Each row-action modal kicks the matching mutation, surfaces snackbar feedback via `core/notices`, and closes on terminal status. `bulk-fix-modal` runs the `confirm → progress → done` state machine from Phase 4 driven by `useFixThreatsStatusQuery`.

### 7. Header CTA — inline strip, no `HeaderActionsProvider`

JS review caught a real wiring gap: `packages/scan` puts CTAs in the AdminPage chrome via `HeaderActionsProvider` because its `<AdminPage>` consumes `useHeaderActions()`. Protect's shell at `protect-app/index.jsx:90–117` uses `JetpackAdminPage` from `@automattic/jetpack-components` + `Tabs.Root` + `<Outlet />` — it has **no header-action slot** and refactoring `JetpackAdminPage` to add one is wider blast radius than this PR should take.

Resolution: the Scan tab renders its CTAs **inline at the top of the tab content**, above `ThreatsDataViews`. No provider, no context, no shared state with `packages/scan`.

```
<ThreatsScreen>
  <CtaStrip>                         {/* HStack with right-aligned actions */}
    <ScanNowButton />                {/* always visible */}
    {fixableCount > 0 && (
      <Button variant="primary" onClick={openBulkFix}>
        {sprintf( __( 'Auto-fix %d threats', 'jetpack-protect' ), fixableCount )}
      </Button>
    )}
  </CtaStrip>
  <ThreatsDataViews ... />            {/* or <ScanStatus /> while running */}
  <BulkFixModal isOpen={bulkFixOpen} onClose={closeBulkFix} />
</ThreatsScreen>
```

`fixableCount` = `data.filter( t => t.status === 'current' && t.fixable ).length` from the merged query. Independent of which status the toggle is on (we still only auto-fix active fixable rows even if the user is currently viewing History).

Visual cost vs `packages/scan`: in Scan the CTAs sit at the page-title row; here they sit at the top of the tab content, directly above the DataViews search/filter row. Acceptable per the figma reference; will confirm against the figma node when the spec is reviewed.

`ScanButton`, `ScanAdminSectionHero`, `ScanningAdminSectionHero` are removed from the Scan render path. If unused elsewhere in Protect (verify in Phase 8), they're deleted.

### 8. Free-tier — `<EmptyState />` dispatch (the C3 commitment)

Reads Protect's existing `usePlan()` hook (confirmed at `projects/plugins/protect/src/js/hooks/use-plan/`; it's the same predicate `free-list.jsx` and `paid-list.jsx` branch on).

The empty slot uses **`ContextualUpgradeTrigger` from `@automattic/jetpack-components`** — already imported in two places in Protect (`free-list.jsx:1`, `scan-footer.jsx:6`) and in Firewall too. It's a card-shaped component with `description` + `cta` + `onClick` props, not a wide hero. UX review specifically flagged that `scan-footer.jsx`'s `SeventyFiveLayout` wrapper (line 129) would NOT fit in DataViews' empty slot — we don't reuse `scan-footer.jsx` itself, just the inner `ContextualUpgradeTrigger` shape with its own copy and a small heading above.

| Tier | State | Renders |
|---|---|---|
| Free | data empty (server gates Scan plan data) | `<VStack>` with heading + `<ContextualUpgradeTrigger>` (Protect's standard upsell card; copy reused from current `scan-footer.jsx:48–66` "Upgrade Jetpack Protect to get advanced scan tools…") |
| Paid | data empty | "All clear" message — Forms-style `VStack` + `Text` heading + muted body, mirroring `packages/scan/src/js/screens/overview/empty-state.tsx` |
| Paid | data empty + History status filter active | **Same "All clear" copy in this initial cut** — see Known limitations |

**On the C3 product decision (Free stops seeing vulnerabilities entirely).** UX review correctly flagged this is a regression vs today, where `FreeList` shows vulnerability records (no malware) to free users. This was an explicit user direction earlier in this design pass: "Both tiers, but free still upsells. Paid users get the new dataviews; free users see a simplified Empty/upsell view (using the new empty slot of ThreatsDataViews to render the existing upsell hero)." Documented here as a deliberate product choice, not an oversight. If we want a follow-up that adds a vulnerability-only DataViews surface for Free, that's a separate spec.

`FreeList`, `PaidList`, `PaidAccordion`, the existing legacy modal component folders are **deleted** by the cleanup commit. `ContextualUpgradeTrigger` and `usePlan()` are **kept** — used elsewhere in Protect.

### 9. Tracks events

Single namespace: `jetpack_protect_scan_*`. No dual-firing of `jetpack_scan_*`.

| Event | Payload | Source |
|---|---|---|
| `jetpack_protect_scan_now` | `{}` | `<ScanNowButton />` click |
| `jetpack_protect_scan_fix_threats_cta_click` | `{ threat_count }` | "Auto-fix N" header CTA click |
| `jetpack_protect_scan_bulk_fix_threats_modal_open` | `{ threat_count }` | bulk-fix modal mount |
| `jetpack_protect_scan_bulk_fix_threats_modal_click` | `{ threat_count }` | confirm button |
| `jetpack_protect_scan_bulk_fix_threats_modal_success` | `{ threat_count, fixed_count, failed_count }` | terminal status: complete |
| `jetpack_protect_scan_bulk_fix_threats_modal_failed` | `{ threat_count }` | terminal status: failed |
| `jetpack_protect_scan_search` | `{ has_query }` | DataViews `onTrackEvent` `'search'` |
| `jetpack_protect_scan_layout_changed` | `{ layout }` | DataViews `'layout_changed'` |
| `jetpack_protect_scan_page_change` | `{ page }` | DataViews `'page_change'` |
| `jetpack_protect_scan_filter_change` | `{}` | DataViews `'filter_change'` |
| `jetpack_protect_scan_view_change` | `{}` | DataViews `'view_change'` (catch-all) |

Transport via `@automattic/jetpack-analytics` (canonical Jetpack tracking client used by Forms / Backup / Activity Log / new Scan page). No hand-rolled `_tkq`.

### 10. Mock mode

`?jpprotect-mock=1` (separate from `?jps-mock=1`). Each fetcher in `data/fetchers.ts` short-circuits via `isProtectMockMode()` and returns Protect-scoped fixtures. Separate flag + fixtures means Scan-page UX iteration and Protect UX iteration don't collide on the same JN site.

A small yellow "Dev mode" banner (mirrors `packages/scan/src/js/mock-banner.tsx`) renders inside the Scan tab when active.

### 11. Notices

`<SnackbarList />` mounted in `routes/scan/v2/notices-list.tsx`, subscribed to `core/notices` store, filtered to `type === 'snackbar'`, sliced to last 3. Mounted inside the Scan tab so it floats over the tab content. Same pattern as `packages/scan/src/js/notices-list.tsx`.

(Reviewer: confirm Protect doesn't already have a SnackbarList higher up in `ProtectApp`. If it does, this duplication can be skipped.)

## File-level impact summary

### Stage 1 PR

#### New files (~20)

`projects/plugins/protect/src/js/routes/scan/v2/` tree as enumerated in §3.

#### Modified

- `projects/packages/scan/src/class-jetpack-scan.php` — explicit clean split of admin-UI gating vs REST registration (§1).
- `projects/packages/scan/src/class-rest-controller.php` — `permissions_check_user()` requires `is_user_connected()` for mutation routes (§2).
- `projects/packages/scan/tests/php/Jetpack_Scan_Bridges_Test.php` — two new tests (REST registers when filter is `false`; mutation routes 403 when no user connected).
- `projects/packages/scan/changelog/` — new entry.
- `projects/plugins/protect/src/js/index.tsx` — wire `/scan` to either `<ScanRoute />` (legacy, default) or `<ScanV2Route />` (when `?protect-scan-v2=1` URL flag or `JETPACK_PROTECT_SCAN_V2` PHP constant is set). `/scan/history` route untouched in Stage 1.
- `projects/plugins/protect/src/class-jetpack-protect.php` — read `JETPACK_PROTECT_SCAN_V2` constant, hydrate it into `jetpackProtectInitialState.scanV2Enabled`.
- `projects/plugins/protect/changelog/` — new entry (Stage 1 add).

#### Verified (not modified)

- `projects/plugins/protect/package.json` line 34: `@tanstack/react-query` already a dep. No new dep needed.

### Stage 2 PR

#### Modified

- `projects/plugins/protect/src/js/index.tsx` — switch `/scan` to mount v2 unconditionally; remove the `?protect-scan-v2=1` flag plumbing; remove `/scan/history` route + add HashRouter redirect.
- `projects/plugins/protect/src/class-jetpack-protect.php` — drop `JETPACK_PROTECT_SCAN_V2` constant + initial-state field.
- `projects/plugins/protect/src/js/components/scan-navigation/index.jsx` — remove `navigateToHistoryPage` and the History-page nav link (folded into in-tab status filter).
- `projects/plugins/protect/changelog/` — new entry (Stage 2 remove + change).

#### Deleted

- `projects/plugins/protect/src/js/routes/scan/index.jsx` (legacy)
- `projects/plugins/protect/src/js/routes/scan/history/` (whole folder)
- `projects/plugins/protect/src/js/routes/scan/scan-admin-section-hero.tsx`
- `projects/plugins/protect/src/js/routes/scan/scan-footer.jsx` (replaced by inline upsell in `<EmptyState />`)
- `projects/plugins/protect/src/js/components/threats-list/` (whole folder — paid-list, free-list, pagination, etc.)
- `projects/plugins/protect/src/js/components/paid-accordion/`
- `projects/plugins/protect/src/js/components/fix-threat-modal/`
- `projects/plugins/protect/src/js/components/ignore-threat-modal/`
- `projects/plugins/protect/src/js/components/unignore-threat-modal/`
- `projects/plugins/protect/src/js/components/threat-fix-header/` (verify in Phase 11)
- `projects/plugins/protect/src/js/components/scan-button/`
- `projects/plugins/protect/src/js/data/scan/use-fixers-mutation.ts`
- `projects/plugins/protect/src/js/data/scan/use-ignore-threat-mutation.ts`
- `projects/plugins/protect/src/js/data/scan/use-unignore-threat-mutation.ts`
- `projects/plugins/protect/src/js/data/scan/use-scan-status-query.ts`
- `projects/plugins/protect/src/js/data/scan/use-start-scan-mutator.ts` (or equivalent name; verify in Phase 11)

`useProtectData`, `usePlan`, `ContextualUpgradeTrigger` consumers in Setup/Firewall are **kept** — still used outside the Scan tab.

## Test plan

### Mock mode

1. Build: `pnpm jetpack build plugins/jetpack --deps`.
2. Rsync to JN: `pnpm jetpack rsync jetpack <jn-host>@ssh.atomicsites.net:/srv/htdocs/wp-content/plugins/jetpack --non-interactive`.
3. Visit `/wp-admin/admin.php?page=jetpack-protect&jpprotect-mock=1#/scan`. Yellow "Dev mode" banner appears, ThreatsDataViews renders with the in-table Active/History toggle defaulting to Active, fixture rows visible, header carries "Scan now" + "Auto-fix N threats".
4. Toggle to History — fixture rows with `status === 'fixed'` or `'ignored'` render; CTA disappears (no fixable+current threats in History).
5. Toggle back to Active. Click "Auto-fix N". Bulk-fix modal opens, transitions to progress, lands on Done summary, snackbar fires.
6. Per-row actions: ignore / unignore / view-details / fix — each fires correct modal → mutation → snackbar → list updates.
7. Reload — view state (filter, sort, search, layout, page) persists via `persistKey`.
8. Visit `/wp-admin/admin.php?page=jetpack-protect#/scan/history` — redirects to `#/scan`.

### Live mode

1. Free-tier site (no Scan plan): `/scan` shows `<EmptyState />` rendering the existing Protect upsell hero. No data fetching errors.
2. Paid-tier site: Active rows render real WPCOM data; History tab works; fix/ignore/unignore round-trip with WPCOM successfully.
3. Click "Scan now" — page swaps to `<ScanStatus />` with progress bar, returns to `<ThreatsDataViews />` when scan settles.
4. DevTools Network: confirm `jetpack_protect_scan_*` Tracks events fire on each interaction.

### Automated

- **PHPUnit** in `packages/scan`: routes register when filter is `false` (1 new test).
- **Jest** in Protect: `useScanThreatsQuery` covers (a) both endpoints succeed → merged shape, (b) one fails → degraded set + error surfaced, (c) both empty → `<EmptyState />` triggered.
- **Jest** in Protect: `EmptyState` paid/free dispatch.
- **Jest** in Protect: `useThreatActions` snackbar wiring.
- **Jest** in Protect: `isFixComplete` polling-status edge cases (mirror `packages/scan` test).

## Risks (post-review)

- **R1 (REST) — RESOLVED.** Filter ungating is an explicit clean split (see §1 code snippet). `permissions_check()` is admin-only; non-admin exposure is a 403, not a leak.
- **R2 (PHP auth) — RESOLVED via §2 hardening.** Mutation routes now also require `is_user_connected()`; admin-only-but-not-user-connected returns 403 instead of silently mis-attributing.
- **R3 (Merged query partial-failure) — RESOLVED.** Three cases enumerated in §5 with explicit UX for each.
- **R4 (Upsell shape) — RESOLVED.** Empty slot uses `ContextualUpgradeTrigger` (card-shaped, fits in slot), not the `SeventyFiveLayout`-wrapped hero. Verified Protect already uses this component in three places (`free-list.jsx`, `scan-footer.jsx`, `firewall/index.jsx`).
- **R5 (`/scan/history` URL) — LOW.** All 7 in-repo refs are inside Protect's own JS (verified via `grep -rn "/scan/history"`); HashRouter URLs aren't reachable as public docs. Internal redirect handled in `index.tsx`. Worth a quick Slack to support before merge.
- **R6 (Tracks) — DEFERRED.** Existing `jetpack_protect_*` events fire from `paid-list.jsx`, `free-list.jsx`, others. Spec proposes clean break to `jetpack_protect_scan_*`. **Open question for the data team** before merge — see §Open questions. If dashboards depend on `jetpack_protect_threat_*`, dual-fire for one release.
- **R7 (Single-PR cleanup) — ACKNOWLEDGED.** 9 phases on one PR. Compromise option: implement Phases 1–7 behind a `?protect-scan-v2=1` URL flag plus a `JETPACK_PROTECT_SCAN_V2` constant, ship as-is, then a follow-up PR flips the default + does Phase 8 cleanup. Mentioned here as the alternative; default still single-PR per existing #48458 pattern.

## Known limitations (deferred polish)

1. **Empty-slot status awareness.** The upstream `ThreatsDataViews` doesn't expose `view`/`onChangeView` for external observation, so `<EmptyState />` can't tell whether the user has the toggle on Active or History. A paid user with no past threats toggling to History sees the same "All clear" copy as Active-empty. Fix needs a small upstream API addition (read-only `view` callback or render-prop empty slot). Phase 2 follow-up.
2. **No URL sync of status filter.** Same upstream blocker — status survives via `persistKey` localStorage, not the URL.
3. **Two parallel queries on every Scan-tab visit.** Active + History both fetch on mount; latency = max not sum, TanStack Query caches. Compare to `packages/scan`'s eager-Active-lazy-History pattern. Acceptable for the initial cut.
4. **persistKey schema versioning.** Inherited concern: if `@automattic/jetpack-scan` releases bump the `View` shape, stored keys can mis-deserialize. Same risk applies to `packages/scan` already; not a Protect-specific problem. Flag as upstream issue, don't block this PR.
5. **DataViews row-selection a11y.** Bulk-fix relies on `@wordpress/dataviews@14.1.0` row checkboxes. Spec adds a manual NVDA / keyboard-only test pass to the test plan; accept whatever upstream supports today.
6. **Plan-tier loading flash.** `<EmptyState />` on initial mount, before `usePlan()` resolves: render a skeleton, NOT an optimistic Free upsell that flashes to Paid view. Skeleton is a 3-line `<div>` placeholder — no spinner. Documented here so implementation doesn't accidentally regress.
7. **Mock-mode flag precedence.** If both `?jpprotect-mock=1` and `?jps-mock=1` are set, Protect's fetcher honors the Protect flag only and ignores `jps-mock` (different package, different fixtures). Documented here for clarity.
8. **Mock dev banner gating.** The yellow Dev banner only renders for users with `manage_options` (same as Scan). Confirmed by mirroring Scan's `Gates` component pattern.

## Decisions (locked 2026-05-07)

1. **Tracks namespace** — **Clean break to `jetpack_protect_scan_*`**. Legacy `jetpack_protect_*` events fired by `paid-list.jsx` / `free-list.jsx` etc. are dropped when those files are deleted in Stage 2. Data-team note (P2 / Slack) to be sent when Stage 1 lands so any dashboards owning the old names can plan around the cutover at Stage 2.
2. **PR strategy** — **Two-stage with feature flag.**
   - **Stage 1 PR**: Phase 0 (filter ungate in `packages/scan`) + Phases 1–7 (introduce `routes/scan/v2/` behind a `?protect-scan-v2=1` URL flag and a `JETPACK_PROTECT_SCAN_V2` PHP constant default-off). Legacy code stays untouched, no cleanup. Reviewers can flip the flag locally to test.
   - **Stage 2 PR**: Phase 8 cleanup (delete legacy files, remove the flag, remove `/scan/history` route + add redirect, switch `/scan` to default-mount the v2 tree). Lands after Stage 1 has soaked.
3. **Mock-mode flag name** — `?jpprotect-mock=1`.
4. **PR base branch** — trunk for both stages.
5. **`v2/` folder name** — keep `routes/scan/v2/` (default in spec). Bikeshed-class; can revisit during code review.

## Adversarial review log (2026-05-07)

Three parallel review teams attacked this spec. Findings + dispositions:

### Resolved in spec body

| Finding | Reviewer | Severity (claimed) | Disposition |
|---|---|---|---|
| HeaderActionsProvider not consumed by `ProtectApp` | JS | BLOCKER | **Resolved.** §7 rewritten to render CTAs inline at top of Scan tab content; no provider needed. |
| Filter-ungating cross-cutting concerns | PHP | IMPORTANT | **Resolved.** §1 now shows the explicit clean split with code snippet. |
| Auth split silent fallback risk | PHP | IMPORTANT | **Resolved.** §2 now mandates `is_user_connected()` check on mutation routes. |
| Merged-query partial-failure UX undefined | JS | BLOCKER | **Resolved.** §5 enumerates three cases (active fails / history fails / both fail) with explicit UX. |
| Upsell hero may not fit `empty` slot | UX | BLOCKER | **Resolved.** §8 specifies `ContextualUpgradeTrigger` (card-shape, not `SeventyFiveLayout` hero). Verified against existing Protect usage. |
| Free-tier vulnerability regression | UX | BLOCKER | **Acknowledged in §8 as a deliberate C3 product choice** (per user's earlier direction). Flagged as a follow-up if reversal is wanted. |

### Rebutted (misread of upstream)

| Finding | Reviewer | Disposition |
|---|---|---|
| `ThreatsStatusToggleGroupControl` requires externally-supplied `view`/`onChangeView` | JS (#1) | **Misread.** Verified at `index.tsx:670–687`: `ThreatsDataViews` manages `view` internally and passes its own `view`/`onChangeView` to the toggle when `showStatusFilter={true}`. The toggle works. The real (already-documented) limitation is that consumers can't *observe* the view state for empty-slot status awareness — that's listed under Known Limitations §1, not a blocker. |

### Accepted as known limitations / deferred

| Finding | Reviewer | Severity (claimed) | Disposition |
|---|---|---|---|
| Empty-slot can't tell Active-empty from History-empty | JS / UX | IMPORTANT | Known limitation §1. Phase 2 polish, needs upstream API additions. |
| persistKey schema versioning | JS | BLOCKER | Known limitation §4. Same risk applies to `packages/scan`; upstream issue, not Protect-specific. |
| Bundle size impact not quantified | JS | IMPORTANT | `@tanstack/react-query` is already a Protect dep (verified at `package.json:34`); new code is ~20 small files. Will measure delta during implementation; not a planning blocker. |
| `/scan/history` URL removal customer impact | UX | BLOCKER | R5 (LOW). All 7 in-repo refs are inside Protect's own JS; no docs reference. Slack-to-support note added. |
| Tracks event clean-break vs dual-fire | UX | MINOR | R6 (DEFERRED) → Open question §1 — needs data-team check. |
| DataViews row-selection a11y | UX | IMPORTANT | Known limitation §5. Manual NVDA + keyboard-only test added to test plan. |
| Plan-tier loading flash | UX | MINOR | Known limitation §6. Skeleton placeholder, not optimistic-Free render. |
| Mock-mode flag precedence | JS | IMPORTANT | Known limitation §7. Protect honors its own flag only. |
| Mock-banner cap-gating | UX | MINOR | Known limitation §8. Mirror Scan's `Gates`/`manage_options` check. |
| Single-PR cleanup blast radius | UX | MINOR | R7 (ACKNOWLEDGED) → Open question §2 — bundled vs two-stage. |
| `v2/` folder naming | JS | MINOR | Bikeshed → Open question §5. |

## Implementation phases (preview — full plan drafted by writing-plans)

Two PRs against trunk. Each phase = one commit.

### Stage 1 PR — "Protect: introduce Scan v2 behind a feature flag"

1. **Phase 0 — REST ungate** in `packages/scan/src/class-jetpack-scan.php`. Split per §1 code snippet. PHPUnit test asserting routes register when filter is `false`. Changelog entry.
2. **Phase 1 — Protect scaffold**: `routes/scan/v2/` tree with `index.tsx` + `data/` layer + `screens/threats.tsx` rendering empty `ThreatsDataViews` against `useScanThreatsQuery`. `?jpprotect-mock=1` works end-to-end, no actions yet. **Mounted only when `?protect-scan-v2=1` URL flag (or `JETPACK_PROTECT_SCAN_V2` PHP constant) is set**; otherwise `/scan` continues to render the legacy `<ScanRoute />`.
3. **Phase 2 — Read paths + status filter**: real merged dataset via `siteScanQuery` + `siteScanHistoryQuery`, `showStatusFilter={true}` defaulting to Active, `persistKey="jetpack-protect:scan:view"`. Snackbar list, mock banner.
4. **Phase 3 — Row actions + modals**: four `Render*Modal` components, three mutations (`useFixThreatsMutation` / `useIgnoreThreatMutation` / `useUnignoreThreatMutation`), polling status query, `useThreatActions` callbacks, snackbar feedback. Plus the §2 `is_user_connected()` hardening on `Rest_Controller::permissions_check_user()`.
5. **Phase 4 — Bulk fix modal + Auto-fix CTA**: inline CTA strip at top of Scan tab (`<ScanNowButton />` + conditional "Auto-fix N"), `BulkFixModal` state machine.
6. **Phase 5 — Scan-now + scan progress**: `<ScanNowButton />` mutation wiring, `<ScanStatus />` takeover during enqueued/running.
7. **Phase 6 — Empty state dispatch**: `<EmptyState />` reads `usePlan()`; Free renders `ContextualUpgradeTrigger`-shaped card, Paid renders "All clear" body. Loading state = skeleton, not optimistic-Free flash.
8. **Phase 7 — Tracks events**: `jetpack_protect_scan_*` wiring through `@automattic/jetpack-analytics` (canonical event names per §9).
9. **Phase 8 — Tests + manual walkthrough**: PHPUnit (Phase 0 + §2 user-conn check), Jest unit tests (`useScanThreatsQuery` partial-failure, `EmptyState` plan dispatch, `useThreatActions` snackbars, `isFixComplete`), manual JN walkthrough on free + paid sites with the flag on.

Stage 1 ships with the legacy code path still default-on. Reviewers and product flip the flag to validate.

### Stage 2 PR — "Protect: cut over Scan to v2, remove legacy"

1. **Phase 9 — Default-on**: switch `/scan` route to mount `routes/scan/v2/` unconditionally. Remove the `?protect-scan-v2=1` URL flag and `JETPACK_PROTECT_SCAN_V2` constant.
2. **Phase 10 — Route cleanup**: remove `/scan/history` route from `index.tsx`; add HashRouter redirect to `/scan` for any inbound `/scan/history` link.
3. **Phase 11 — File deletion**: delete legacy threat-list components, modals, hooks, scan-now button, scan-progress hero, history route — full list in §File-level impact summary.
4. **Phase 12 — Final lint / type / changelog**: `pnpm jetpack lint plugins/protect`, `pnpm jetpack typecheck plugins/protect`, changelog entry.

---

## Acceptance criteria

- Protect Scan tab renders `ThreatsDataViews` with in-table Active/History toggle (default Active).
- Free users see Protect's existing upsell hero in the empty slot.
- Paid users see real threat data, can fix/ignore/unignore/view-details, can scan now, can bulk-fix.
- Firewall, Account Protection, Settings, Setup routes are byte-identical to trunk.
- Tracks events fire under `jetpack_protect_scan_*`.
- All listed legacy files deleted; lint/typecheck pass.
- New PHPUnit + Jest tests pass.
- Manual JN walkthrough on a free site and on a paid site both pass the test plan above.
