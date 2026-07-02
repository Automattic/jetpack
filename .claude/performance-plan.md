# Jetpack Performance Improvement Plan

Working plan for Claude Code sessions. Goal: reduce Jetpack's frontend weight and per-request server cost. **Performance only — zero user-perceivable feature, UI, or behavior changes.** The bar is user equivalence, not byte identity: removing dead weight that does nothing for the user (unused scripts, dead includes, pointless requests) is in scope and encouraged. What must not change is anything a user can see or interact with.

## Hard constraints

1. No user-perceivable feature, UI, or behavior changes. Markup/asset diffs are fine when the removed thing demonstrably did nothing for the user (prove it — don't assume it). When an asset is genuinely needed, prefer removing it where it isn't needed over deferring it everywhere.
2. Every optimization ships behind a filter defaulting to **current behavior** first; flip the default only after the verification protocol passes.
3. One phase task per PR. Each PR touching a project needs `jp changelog add`.
4. Never remove a public hook, filter, or function signature.

## Verified findings (audited 2026-07, file:line checked against this checkout)

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| F1 | WooCommerce Analytics enqueues `https://stats.wp.com/s-{YW}.js` + inline `_wca` script in `wp_head` on **every** non-404 frontend page when Woo is active — no store-relevance check | `projects/plugins/jetpack/modules/woocommerce-analytics/class-jetpack-woocommerce-analytics.php:89-135` | High |
| F2 | All active modules' PHP `include_once`'d on every request regardless of context (frontend loads admin-only code); `configure()` unconditionally ensures sync/stats/JITM/WAF | `projects/plugins/jetpack/class.jetpack.php:1635-1713` | High |
| F3 | Sync queue write amplification: `jpsq_sync-*` rows, wp_options storage path still exists alongside dedicated table; listeners active on anonymous requests | `projects/packages/sync/src/sync-queue/class-queue-storage-table.php`, sync listeners | High |
| F4 | Heartbeat calls `get_dirsize()` on uploads dir with no cache/bound — unbounded I/O on large sites (cron-side) | `projects/plugins/jetpack/class.jetpack-heartbeat.php:90` | Medium |
| F5 | Compat files for creative-mail / boost / backup / wc-services load unconditionally | `class.jetpack.php` compat loading | Low |
| F6 | Not all frontend enqueues use `strategy => defer/async` | various modules | Medium |

**Already well-optimized — do not rework:** carousel, related-posts, sharing, subscriptions, hovercards conditionals; block assets via `render_callback`; CSS concat already removed; devicepx removed.

## Phase 0 — Measurement harness (prerequisite; build first)

No optimization merges until this exists.

1. **Enqueue manifest snapshot tool**: WP-CLI script that, for a fixed set of templates (home, single post, archive, search, woo product, woo cart), records: script/style handles + src + strategy, inline scripts in head/footer, external hosts contacted. Store JSON snapshots; CI-diffable. Acceptance: running twice on unchanged code produces identical output.
2. **Server baseline**: wp-env or `jp docker up`, then k6/ab TTFB + Query Monitor query counts + peak memory for anonymous requests. Record per template.
3. **Visual regression**: Playwright screenshots of the same templates (reuse existing e2e infra in `projects/plugins/jetpack/tests/e2e`).
4. **PHP coverage of one anonymous request**: pcov/xdebug coverage dump to quantify never-executed lines per included module file (feeds Phase 3 prioritization).

## Phase 1 — Quick wins

- **F1**: Move the store-relevance decision server-side: only enqueue tracking + `_wca` inline when the connection is ready and the page is store-related (mirror the module's existing client checks: `is_cart/is_checkout/is_product/...` or presence of Woo blocks). Verify: manifest diff shows script removed on non-store pages only; identical on store pages.
- **F4**: Wrap `get_dirsize()` with WP's dirsize cache + a transient (e.g. weekly) and a hard time bound; report cached value otherwise.
- **F5**: Load each compat file only if its target plugin is active.

## Phase 2 — Asset delivery

- **F6**: Audit every frontend `wp_enqueue_script` in `projects/plugins/jetpack/modules/` and `projects/packages/` for missing `strategy => 'defer'|'async'` / `in_footer`. For each handle, first ask whether the script is needed on that page at all — if not, stop enqueueing it there (that's the F1 pattern); only reach for `defer`/`async` on scripts that are genuinely needed. Justify each one left render-blocking.
- Lazy-load the Likes `widgets.wp.com/likes/master.html` iframe via IntersectionObserver. UI must be pixel-identical once visible.

## Phase 3 — PHP boot cost (highest payoff, highest care)

- Context-aware module loading: use Phase 0 coverage data to rank modules by wasted include cost; per module, split admin-only code (settings screens, module-info) so anonymous frontend requests skip it. One module per PR, behind `jetpack_context_aware_module_loading` filter (default off → soak → default on).
- Lazy `config->ensure()` for consumers not needed by the current request type.

## Phase 4 — Sync

- Make the dedicated queue table (`class-queue-storage-table.php`) the default storage everywhere; keep wp_options as fallback only.
- Batch queue INSERTs where multiple actions fire in one request.
- Verify a fully cached anonymous page view performs **zero** sync queue writes.
- Check `jetpack_callables_sync_checksum`-style options aren't autoloaded blobs (ref GitHub #8115).

## Verification protocol (every PR)

1. Manifest snapshot diff: intended removals/strategy changes only; nothing added, nothing else changed.
2. Playwright screenshots: pixel-identical on affected templates.
3. `jp test php <project>` + `jp phan` for every touched project; relevant e2e suite.
4. TTFB/memory/query-count comparison vs baseline; record numbers in the PR description.
5. For sync changes: full-sync integrity check (checksums match before/after) in the Docker env; `projects/plugins/debug-helper` has sync inspection tools.

## Open investigations (do before the related phase)

- Rank modules by dead-include cost from the Phase 0 coverage run.
- Enumerate autoloaded `jetpack_*` option names/sizes on a realistic DB.
- Measure sync INSERT latency under concurrent writes (dedicated table vs options).
- Confirm no connection/identity-crisis check can make an in-band HTTP request during a visitor page view.

## Status

- [ ] Phase 0 harness
- [ ] Phase 1 (F1, F4, F5)
- [ ] Phase 2 (F6, likes iframe)
- [ ] Phase 3 (context-aware loading)
- [ ] Phase 4 (sync)

Update checkboxes and add PR links as work lands.
