# Modernize the Jetpack Beta plugin UI

**Date:** 2026-06-01
**Branch:** `update/modernize-jetpack-beta-ui`
**Status:** Approved design

## Goal

Replace the Jetpack Beta Tester admin UI with a modern React application built on the
**`@wordpress/ui`** design-system library, backed by **WordPress Abilities API** endpoints
for all reads and writes.

Today the plugin is the only major Jetpack plugin with zero JS tooling: it is 100%
server-rendered PHP templates plus a 268-line vanilla `admin.js`, a 136-line `updates.js`,
and a hand-rolled **1299-line `admin.css`** that reimplements old Calypso "dops-" cards,
toggles, and search widgets. This work modernizes the front end and the data layer.

## Boundaries

**In scope**

- The two admin screens: plugin-select landing and plugin-manage.
- Global toggles (autoupdates, email notifications).
- "Needed updates" surface, "To Test" / "What changed" panels, branch search/filter.
- Abilities API backend for all reads and the mutating actions.

**Out of scope (remain PHP, unchanged)**

- The `admin_notices` first-run banner on the plugins list page (`notice.template.php`).
- The WP-CLI command (`class-clicommand.php`).
- The install/download engine `Plugin::install_and_activate()` and the `Plugin`/`Utils`
  data model — reused unchanged behind abilities.

## Backend — Abilities API

New `src/abilities/class-beta-abilities.php`, a `Beta_Abilities extends Registrar` class
mirroring `Automattic\Jetpack\Connection\Abilities\Connection_Abilities`. Category slug
`jetpack-beta`. Add `automattic/jetpack-wp-abilities: @dev` to `composer.json`.

| Ability | Type | Input → Output |
|---|---|---|
| `jetpack-beta/list-plugins` | read | – → manageable plugins with active state + version |
| `jetpack-beta/get-plugin` | read | `{slug}` → branches (stable / rc / trunk + PR list + releases), active branch, currently-running, `is_mu_plugin`, to-test HTML, what-changed HTML, needed-updates |
| `jetpack-beta/get-settings` | read | – → `{autoupdates, email_notifications, skip_email}` |
| `jetpack-beta/activate-branch` | write | `{slug, source, id}` → result (wraps `install_and_activate`) |
| `jetpack-beta/update-settings` | write | `{autoupdates?, email_notifications?}` (partial) → new settings state |

Notes:

- **Permissions:** every `permission_callback` gates on `current_user_can('update_plugins')`
  (the same capability the admin menu uses) and preserves the multisite / network-admin
  redirects currently in `Admin::admin_page_load()`.
- **Markdown rendering** (Parsedown → `wp_kses_post`) stays server-side; the read abilities
  return already-sanitized HTML strings for the "To Test" / "What changed" panels.
- **`update-settings`** is a single ability taking a partial settings object so the toggle
  surface stays as one endpoint (rather than one ability per toggle). When autoupdates is
  turned on it triggers `Hooks::maybe_schedule_autoupdate()` exactly as the current handler
  does; `email_notifications` is ignored when `JETPACK_BETA_SKIP_EMAIL` is defined.
- **MCP exposure:** `meta.mcp.public = false` for all of them — installing arbitrary PR code
  is sensitive and must not be an agent-callable tool. `meta.show_in_rest = true` so the
  plugin's own React app can use the REST run route.
- **Annotations:** reads are `readonly: true, idempotent: true`; `activate-branch` is
  `destructive: false` (installs code but is reversible) and not idempotent;
  `update-settings` is a non-idempotent write.

## Frontend — React app

New `src/js/` tree, plus `package.json` and `webpack.config.js` using
`@automattic/jetpack-webpack-config` (same harness as the Protect plugin), building into
`build/`. Dependencies: `@wordpress/ui`, `@wordpress/element`, `@wordpress/api-fetch`,
`@wordpress/i18n`, `@automattic/jetpack-base-styles`, and `@wordpress/components` only if a
toggle/switch primitive is needed (see Risks).

- **Entry / bootstrap:** `Admin::render()` prints a root `<div>`, enqueues the webpack build,
  and localizes a small bootstrap object: REST root + nonce, the current `plugin` query-arg
  slug, the user capability flag, and the **initial payload** for the requested screen so
  there is no loading flash on first paint. Mutations and subsequent refreshes go through the
  abilities run endpoint.
- **Routing:** client-side, driven by the `plugin` query arg. `PluginList` (landing) ↔
  `PluginManage`. Navigating updates the URL so links/back button keep working.
- **Component mapping (old → `@wordpress/ui`):**
  - foldable "dops-card" → `Card` / `CollapsibleCard`
  - branch cards → `Card` + `Badge` (active / stable / RC marker) + `Button` (Activate)
  - `form-toggle` switches → toggle control (see Risks)
  - dops-search → controlled text input filtering the PR / release lists client-side
    (replaces the indexing logic in `admin.js`)
  - "To Test" / "What changed" → `CollapsibleCard` rendering the sanitized HTML
  - notices / errors → `Notice`
- **Action client:** thin wrapper over
  `apiFetch({ path: '/wp-abilities/v1/abilities/<id>/run', method: 'POST', data })`.
  - **Activate** shows a busy state on the clicked button (download can take 10-30s), then
    refetches `get-plugin` to refresh active state.
  - **Toggles** call `update-settings` optimistically and roll back on error.

## Files

**Add**
- `src/abilities/class-beta-abilities.php`
- `package.json`, `webpack.config.js`, and TS/babel config as needed
- `src/js/**` — app entry, `PluginList`, `PluginManage`, branch card, toggles, search,
  abilities API client, styles (small SCSS for layout only; visuals come from `@wordpress/ui`)

**Modify**
- `composer.json` — add `automattic/jetpack-wp-abilities`
- `src/class-admin.php` — render container + enqueue build + bootstrap; move
  `to_test_content()` and toggle logic into abilities
- `jetpack-beta.php` — load/init abilities

**Delete**
- `src/admin/plugin-select.template.php`, `plugin-manage.template.php`,
  `branch-card.template.php`, `header.template.php`, `toggles.template.php`,
  `show-needed-updates.template.php`
- `src/admin/admin.js`, `src/admin/updates.js`, `src/admin/admin.css`
- (Keep `notice.template.php` and `exception.template.php`.)

## Testing & ship

- PHP unit test for ability registration + permission gating, mirroring
  `Connection_Abilities_Test`. (Per project convention, PHPUnit is run by CI, not locally.)
- `changelogger` entry.
- `pnpm jetpack build plugins/beta`, then rsync the built plugin to a fresh **Jurassic Ninja**
  site (jetpack-test-jurassic-ninja skill), Jetpack-connect, and capture before/after
  screenshots of both screens.

## Risks & open questions

- **Toggle primitive:** `@wordpress/ui` 0.13.0 is experimental and may not export a
  toggle/switch. If it does not, use `ToggleControl` from `@wordpress/components` for the
  toggles only; everything else stays on `@wordpress/ui`. Confirmed at build time.
- **Synchronous activate:** activation runs synchronously over REST (no async job queue).
  Acceptable — it matches today's blocking redirect behavior — handled with a button-level
  loading state and a generous request timeout.
- **Initial-data freshness:** bootstrapped payload is computed once per page load; remote
  data (GitHub manifest, wporg versions) is already cached by `Plugin`, so this matches
  current behavior.
