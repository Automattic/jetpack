# Scan

The Scan UI for the Jetpack plugin's wp-admin. Ports the Calypso Dashboard's
Scan overview onto a native wp-admin page so customers see the same
active-threats and scan-history experience without leaving their site.

Calypso source pin: `client/dashboard/sites/scan/`,
`client/dashboard/sites/scan-active/`, `client/dashboard/sites/scan-history/`
at commit `<<calypso-sha-to-record-on-first-port>>`. When re-syncing from
upstream, update the pin and note any behaviour deltas in the relevant
changelog entry.

## Quick commands

```bash
# Node engine pin (REQUIRED — package.json `engines` enforces ^24.14.0).
nvm use 24.14.0

# Quality gates (CI runs these — locally same args, same exit codes).
pnpm --dir projects/packages/scan run typecheck            # tsgo --noEmit
pnpm --dir projects/packages/scan run build                # wp-build (esbuild)
pnpm --dir projects/packages/scan test                     # jest
pnpm run lint-file --max-warnings=0 projects/packages/scan/
composer phpcs:lint projects/packages/scan/
cd projects/packages/scan && composer phpunit              # 9/9

# Ship the changed package to JN (~20s after the first --deps build).
pnpm jetpack build plugins/jetpack
pnpm jetpack rsync jetpack <jn-host>@ssh.atomicsites.net:/srv/htdocs/wp-content/plugins/jetpack --non-interactive

# Commit (use --no-verify until the eslint-plugin-package-json husky quirk
# is fixed — the rule fires inconsistently in worktrees but passes when
# `pnpm run lint-file --max-warnings=0` is run directly. CI's `lint-required`
# is the source of truth and passes clean.)
git commit --no-verify -m "Scan: ..."
```

Mock mode: append `?jps-mock=1` to any wp-admin URL on the page to short-circuit
every gate and render the overview against fixtures from
`src/js/data/mock/fixtures.ts`. No server requests fire.

## Key files

```
projects/packages/scan/
├── src/
│   ├── class-jetpack-scan.php          ← admin menu + WP_Build_Polyfills::register
│   │                                     + bridge_wp_build_enqueue (slug bridge)
│   │                                     + fix_boot_import_map_ordering
│   ├── class-rest-controller.php       ← 8 routes; proxy_get/proxy_post split
│   │                                     blog auth (site-level) vs user auth (alerts)
│   └── js/
│       ├── data/                       ← fetchers, query-options, mutation hooks,
│       │                                 use-fix-threats-status (2 s polling),
│       │                                 use-track-event (jetpack-analytics)
│       └── screens/overview/           ← active-threats, scan-history, and the
│                                         five row-action / bulk modals
├── routes/index/                       ← wp-build entry: route.tsx (route config),
│                                         stage.tsx (mounts QueryClientProvider +
│                                         renders <ScanPage>), route.scss, package.json
├── _inc/components/scan-page.{tsx,scss} ← page chrome (Page + Tabs.Root + sticky header)
└── tests/php/Jetpack_Scan_Bridges_Test.php
```

`src/js/index.js`, `admin.tsx`, `shell.tsx`, `providers.tsx`, `routes.ts`, and
`screens/overview/index.tsx` from earlier phases were **removed** during the
wp-build migration. Don't look for them.

## Non-obvious patterns

### Build pipeline

- Build is **`@wordpress/build`** (esbuild), not webpack. Mirrors Newsletter
  ([#48420](https://github.com/Automattic/jetpack/pull/48420)) and Forms.
- `pnpm run build` runs `build:deps` first via
  `pnpm --filter '@automattic/jetpack-scan-page...' --filter '!@automattic/jetpack-scan-page' run build`.
  The trailing `...` walks the **transitive** workspace dependency graph in
  topological order so esbuild can resolve `@automattic/jetpack-components`,
  `@automattic/jetpack-scan`, `@automattic/jetpack-boost-score-api`,
  `social-logos`, etc. Without this, clean checkouts fail because esbuild
  resolves workspace packages through their `default` export
  (`./build/index.js`), not `jetpack:src`.
- The `@automattic/jetpack-scan` js-package needs `copy-scss` in its build
  (`tools/copy-scss-to-build.mjs`) so the compiled output ships the
  `*.module.scss` files alongside the JS — esbuild-based consumers resolve
  `import styles from './styles.module.scss'` against the package's compiled
  tree, not its source. Webpack-based consumers (current Protect) keep
  working unchanged.

### Routing

- `@wordpress/route` (`useNavigate` / `useSearch`), **not** `react-router`.
  Single overview route at `/`; `?tab=active|history` switches panels.
- Tab nav: Newsletter pattern — single `Tabs.Root` from `@wordpress/ui` so
  the active-tab indicator slides between tabs instead of remounting.

### REST bridges (admin-only) under `jetpack/v4/site/scan/*`

| Route | WPCOM endpoint | Auth |
| --- | --- | --- |
| `GET /site/scan` | `/sites/:id/scan` | **blog** (matches Protect's `Threats::fetch_status()`) |
| `GET /site/scan/history` | `/sites/:id/scan/history` | **blog** |
| `GET /site/scan/counts` | `/sites/:id/scan/counts` | **blog** |
| `POST /site/scan/enqueue` | `/sites/:id/scan/enqueue` | **blog** (matches Protect's `Threats::scan()`) |
| `POST /site/scan/threat/{id}/{ignore,unignore}` | `/sites/:id/alerts/:tid` | **user** |
| `POST /site/scan/threats/fix` | `/sites/:id/alerts/fix` | **user** |
| `GET /site/scan/threats/fix-status` | `/sites/:id/alerts/fix?...` | **user** |

`proxy_get` / `proxy_post` take an `$as_blog` flag (default `false`). All
requests forward `X-Forwarded-For` for audit-log alignment with
`/jetpack/v4/site/activity`.

### DataViews row actions

Row actions go through `Render*Modal` props on the upstream `ThreatsDataViews`
in `@automattic/jetpack-scan` (the js-package — **not** this `-page`):
`RenderFixModal`, `RenderIgnoreModal`, `RenderUnignoreModal`, `RenderViewModal`.
Each takes a `(props: RenderModalProps<Threat>) => ReactElement` component;
DataViews wraps it in its own Modal.

The view-details action is **always eligible** (any row, any status); fix /
ignore / unignore are gated by `fixable` / `status === 'current'` /
`status === 'ignored'` respectively.

The inline `ThreatFixerButton` in the Auto-fix column still fires a direct
mutation. Open product question whether it should also open `FixThreatModal`
(DataViews has no programmatic way to open a row-action modal from a custom
field renderer, so unifying means lifting modal state into the panel).

### Other upstream `ThreatsDataViews` props

- `showStatusFilter={ false }` — hides the in-table active/historic toggle
  when consumers already filter the dataset by status outside the component
  (e.g. our page-level tabs).
- `onTrackEvent={ (event, props) => ... }` — receives canonical event names
  on view transitions (`search` `{ has_query }`, `layout_changed`
  `{ layout }`, `page_change` `{ page }`, `filter_change`, `view_change`).
  Both panels prefix to `jetpack_scan_*`.
- `persistKey="jetpack-scan:active-threats:view"` (and
  `:scan-history:view`) — hydrates and writes view state to localStorage
  so filters / sort / search / page / layout round-trip across reloads.
- `empty={ <EmptyState /> }` — DataViews still shows its column headers and
  filter chrome above the empty body so reviewers always see the table shell.

### UI primitives priority

When adding React UI in this package, prefer the WordPress Design System
packages in this order:

1. **`@wordpress/ui`** — preferred. Foundational primitives (`Dialog`,
   `Button`, `Notice`, `Stack`, `Text`, `Tabs`, `Badge`). Check each
   component's Storybook "Status" badge — anything other than "stable" is
   still in flux; avoid experimental APIs.
2. **`@automattic/design-system`** — second choice; not currently in the
   monorepo. Fills gaps between `@wordpress/ui` and `@wordpress/components`.
3. **`@wordpress/components`** — fallback. Use only when neither of the
   above ships a stable equivalent (e.g. `Spinner`, `info`-variant `Notice`,
   inline `__experimental*` primitives kept for migration). All four modals
   in this package have already moved to `@wordpress/ui`.
4. **`@wordpress/dataviews`** — higher-level data presentation. Backbone of
   Active threats / History tabs. Extend via its own sub-components
   (`DataViews.Search`, `.FiltersToggle`, `.Layout`, `.Footer`) before
   reaching for lower-level primitives.
5. **`@wordpress/admin-ui`** — page layout. `Page` is the wp-admin page
   wrapper our `<ScanPage>` chrome renders.

A dedicated MCP server is wired into the project's local Claude Code config:
`@wordpress/design-system-mcp`. It exposes the authoritative list of stable
`@wordpress/ui` + `@wordpress/components` components and `--wpds-*` design
tokens. Prefer querying it over spelunking through
`node_modules/@wordpress/components/src/**`.

### Tracking transport

**MUST** use `@automattic/jetpack-analytics` (already wrapped by
`data/use-track-event.ts`). Same client Forms / Backup / Activity Log /
Newsletter use. Do NOT reintroduce a hand-rolled `_tkq` shim.

### Reused threat primitives

`ThreatSeverityBadge`, the `Threat` type, and the lower-level
`ThreatsDataViews` view live in `@automattic/jetpack-scan` (the existing
js-package, **not** this `-page`). Reuse those building blocks rather than
re-inventing them here. Calypso's modals are richer than what that package
ships — those are ported into this package and wired via the
`Render*Modal` props above.

### Changelogger conventions

- Plugin entries (`projects/plugins/jetpack/changelog/*`) use
  `Type: enhancement` (or `bugfix` / `compat` / `major` / `other`).
  **Never `Type: added`** — the plugin's changelogger restricts types and
  rejects `added`.
- `CHANGELOG.md` headings: `## 0.1.0-alpha - unreleased`. **Not**
  `## [0.1.0-alpha] - unreleased` — the brackets imply a markdown link
  target the changelog validator can't resolve.

## See also

- **Tracking issue:** [#48456](https://github.com/Automattic/jetpack/issues/48456)
  — phase plan, decisions, open follow-ups, mirror-repo gating.
- **Implementation PR:** [#48458](https://github.com/Automattic/jetpack/pull/48458).
- **Reference PRs** — read with `git show origin/<branch>:<path>` instead of
  checking out:
  - [#48420](https://github.com/Automattic/jetpack/pull/48420) — Newsletter
    unified page (canonical wp-build + Tabs.Root pattern). Branch
    `try/jetpack-newsletter-unified`.
  - [#48244](https://github.com/Automattic/jetpack/pull/48244) — Activity
    Log port. Reference for the broader 8-phase port pattern.
  - [#48236](https://github.com/Automattic/jetpack/pull/48236) — Backup port
    (in flight). Branch `try/jetpack-backup-new-ui`.
- **Calypso source** —
  [`scan/`](https://github.com/Automattic/wp-calypso/tree/trunk/client/dashboard/sites/scan),
  [`scan-active/`](https://github.com/Automattic/wp-calypso/tree/trunk/client/dashboard/sites/scan-active),
  [`scan-history/`](https://github.com/Automattic/wp-calypso/tree/trunk/client/dashboard/sites/scan-history).
