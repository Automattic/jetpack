# Jetpack Beta UI Modernization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Jetpack Beta Tester admin UI (PHP templates + vanilla JS + 1299-line hand-rolled CSS) with a React app built on `@wordpress/ui` and the shared `@automattic/jetpack-components` `AdminPage` chrome, backed by WordPress Abilities API endpoints.

**Architecture:** A `Beta_Abilities` registrar exposes reads (`list-plugins`, `get-plugin`, `get-settings`) and writes (`activate-branch`, `update-settings`) over the `wp-abilities/v1` REST run route. `Admin::render()` prints a root node, enqueues a webpack build, and localizes a bootstrap (REST root/nonce + current screen payload). The React app renders the two screens with `AdminPage` (header/footer/breadcrumbs) wrapping `@wordpress/ui` content, calling abilities via `@wordpress/api-fetch`.

**Tech Stack:** PHP (WP Abilities API, `automattic/jetpack-wp-abilities`), React 18, `@wordpress/element`, `@wordpress/ui` 0.13.0, `@automattic/jetpack-components` (AdminPage/JetpackFooter), `@wordpress/api-fetch`, `@wordpress/i18n`, `@automattic/jetpack-webpack-config`.

**Working dir for all paths:** `projects/plugins/beta/`

**Spec:** `docs/superpowers/specs/2026-06-01-modernize-jetpack-beta-ui-design.md`

---

## Key references (read before coding)

- Abilities registrar base: `projects/packages/wp-abilities/src/class-registrar.php`
- Reference ability impl: `projects/packages/connection/src/abilities/class-connection-abilities.php`
- AdminPage chrome usage: `projects/packages/activity-log/src/js/components/ActivityLog/index.tsx`
- Webpack harness reference: `projects/plugins/protect/webpack.config.js` + `projects/plugins/protect/package.json`
- Data model: `projects/plugins/beta/src/class-plugin.php`, `src/class-utils.php`, `src/class-admin.php`
- Current screens being replaced: `src/admin/plugin-select.template.php`, `src/admin/plugin-manage.template.php`, `src/admin/branch-card.template.php`, `src/admin/toggles.template.php`

---

## Phase 0 — Build scaffold & composer wiring

### Task 1: Add JS build tooling + wp-abilities composer dep

**Files:**
- Create: `package.json`, `webpack.config.js`, `tsconfig.json`, `babel.config.js`
- Modify: `composer.json`, `.gitignore`

- [ ] **Step 1: Create `package.json`** (model on `projects/plugins/protect/package.json`)

```json
{
	"private": true,
	"name": "@automattic/jetpack-beta",
	"version": "4.2.0",
	"description": "Jetpack Beta Tester admin UI.",
	"scripts": {
		"build": "pnpm run clean && pnpm run build-client",
		"build-client": "webpack",
		"build-production": "NODE_ENV=production BABEL_ENV=production pnpm run build-client",
		"clean": "rm -rf build/",
		"typecheck": "tsgo --noEmit",
		"watch": "pnpm run build && webpack watch"
	},
	"dependencies": {
		"@automattic/jetpack-base-styles": "workspace:*",
		"@automattic/jetpack-components": "workspace:*",
		"@wordpress/api-fetch": "7.46.0",
		"@wordpress/components": "33.1.0",
		"@wordpress/element": "6.46.0",
		"@wordpress/i18n": "6.19.0",
		"@wordpress/ui": "0.13.0"
	},
	"devDependencies": {
		"@automattic/jetpack-webpack-config": "workspace:*",
		"webpack": "5.94.0",
		"webpack-cli": "5.1.4"
	}
}
```

Pin exact versions to whatever the monorepo currently resolves — copy the version strings from `projects/plugins/protect/package.json` rather than the literals above if they differ.

- [ ] **Step 2: Create `webpack.config.js`** — copy `projects/plugins/protect/webpack.config.js` verbatim, then change `entry.index` to `'./src/js/index.tsx'`, keep `output.path` = `./build`, and set the `jetpackConfig` external `consumer_slug` to `'jetpack-beta'`.

- [ ] **Step 3: Create `tsconfig.json` and `babel.config.js`** — copy from `projects/plugins/protect/` (same harness). Adjust `include` to `src/js`.

- [ ] **Step 4: Add the abilities dependency to `composer.json`** under `require`, alphabetically among the `automattic/jetpack-*` entries:

```json
"automattic/jetpack-wp-abilities": "@dev",
```

- [ ] **Step 5: Update `.gitignore`** — add `build/` and `node_modules/` if not present.

- [ ] **Step 6: Install** — from repo root:

```bash
pnpm jetpack install plugins/beta
```

Expected: composer pulls in `automattic/jetpack-wp-abilities` (visible in `vendor/`), pnpm links workspace deps. If it reports lockfile changes, run the suggested `jetpack install -r ...` once.

- [ ] **Step 7: Commit**

```bash
git add projects/plugins/beta/package.json projects/plugins/beta/webpack.config.js projects/plugins/beta/tsconfig.json projects/plugins/beta/babel.config.js projects/plugins/beta/composer.json projects/plugins/beta/composer.lock projects/plugins/beta/.gitignore pnpm-lock.yaml
git commit -m "Jetpack Beta: add JS build tooling and wp-abilities dependency"
```

---

## Phase 1 — Backend abilities

### Task 2: `Beta_Abilities` registrar — read abilities

**Files:**
- Create: `src/abilities/class-beta-abilities.php`
- Reference: `projects/packages/connection/src/abilities/class-connection-abilities.php`

The class extends `Automattic\Jetpack\WP_Abilities\Registrar`, namespace `Automattic\JetpackBeta\Abilities`, category slug `jetpack-beta`.

- [ ] **Step 1: Class skeleton + category + init override.** Override `init()` to register Beta's abilities **without** the global `jetpack_wp_abilities_enabled` gate (Beta's UI depends on them and Beta is not part of the staged Jetpack rollout). Keep the parent's per-item `should_register` behavior by reusing `register_category()`/`register_abilities()`.

```php
<?php
/**
 * Jetpack Beta Abilities Registration.
 *
 * @package automattic/jetpack-beta
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod -- Abilities API added in WP 6.9.

namespace Automattic\JetpackBeta\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use Automattic\JetpackBeta\Admin;
use Automattic\JetpackBeta\Hooks;
use Automattic\JetpackBeta\Plugin;
use Automattic\JetpackBeta\Utils;

/**
 * Registers Jetpack Beta abilities with the WordPress Abilities API.
 */
class Beta_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-beta';

	/**
	 * Register Beta's abilities directly on the Abilities API init actions.
	 *
	 * Unlike the parent, this intentionally does NOT consult the global
	 * `jetpack_wp_abilities_enabled` rollout filter: the Beta Tester admin UI
	 * is built entirely on these abilities, and Beta is a standalone developer
	 * tool rather than part of the staged Jetpack rollout. Per-ability gating
	 * via `jetpack_wp_abilities_should_register` still applies.
	 */
	public static function init() {
		if ( did_action( self::CATEGORIES_INIT_ACTION ) ) {
			static::register_category();
		} else {
			add_action( self::CATEGORIES_INIT_ACTION, array( static::class, 'register_category' ) );
		}
		if ( did_action( self::ABILITIES_INIT_ACTION ) ) {
			static::register_abilities();
		} else {
			add_action( self::ABILITIES_INIT_ACTION, array( static::class, 'register_abilities' ) );
		}
	}

	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	public static function get_category_definition(): array {
		return array(
			'label'       => 'Jetpack Beta', // Product name, not translated.
			'description' => __( 'Abilities provided by the Jetpack Beta Tester.', 'jetpack-beta' ),
		);
	}

	public static function get_abilities(): array {
		return array(
			'jetpack-beta/list-plugins'    => self::spec_list_plugins(),
			'jetpack-beta/get-plugin'      => self::spec_get_plugin(),
			'jetpack-beta/get-settings'    => self::spec_get_settings(),
			'jetpack-beta/activate-branch' => self::spec_activate_branch(),
			'jetpack-beta/update-settings' => self::spec_update_settings(),
		);
	}

	/**
	 * Shared permission check — mirrors the admin menu capability.
	 */
	public static function can_manage(): bool {
		return current_user_can( 'update_plugins' );
	}
}
```

- [ ] **Step 2: `spec_list_plugins()` + `list_plugins()` execute callback.** Zero-arg read. Output: array of `{ slug, name, active_which (stable|dev|null), active_version (string|null), manage_url }`. Build by iterating `Plugin::get_all_plugins( true )` and replicating the active/version logic from `plugin-select.template.php` (`is_active('stable')` → `plugin_slug()`/`stable_pretty_version()`; `is_active('dev')` → `dev_plugin_slug()`/`dev_pretty_version()`; else inactive). `manage_url` = `Utils::admin_url( array( 'plugin' => $slug ) )`.

Annotations: `readonly: true, idempotent: true`; `show_in_rest: true`; `mcp: { public: false }`. `permission_callback` = `array( __CLASS__, 'can_manage' )`. `input_schema` = empty object (`additionalProperties:false`).

- [ ] **Step 3: `spec_get_plugin()` + `get_plugin()` execute callback.** Input: `{ slug: string }`. Reproduce the view-model that `plugin-manage.template.php` assembles, returning JSON instead of HTML:
  - `name`, `is_mu_plugin`, `bug_report_url`
  - `currently_running`: `{ which, source, id, version, pretty_version }` or null (from the `$active_branch`/`$version` logic)
  - `sections`: an ordered list of branch cards, each `{ section: 'stable'|'rc'|'trunk'|'pr'|'release'|'existing', source, id, branch, version, pretty_version, is_active (bool) }`. Derive from `Plugin::source_info()` for stable/rc/trunk, `get_manifest()->pr` for PRs, and `get_wporg_data()->versions` (sorted via `Composer\Semver\Semver::rsort`) for releases — matching the template's ordering and the "fixup active branch" logic.
  - `to_test_html` and `what_changed_html`: call the existing `Admin::to_test_content( $plugin )` (already returns sanitized HTML).
  - `needed_updates`: whatever `show-needed-updates.template.php` computes (port that read).
  - On unknown slug, return a `WP_Error( 'unknown_plugin', ... )` (the run controller surfaces it as an error response).

Annotations same as list-plugins (readonly). `permission_callback` must also enforce the multisite/network-admin rule from `Admin::admin_page_load()` (deny + appropriate error when the managed plugin is network-activated and `! is_network_admin()`).

- [ ] **Step 4: `spec_get_settings()` + `get_settings()`.** Zero-arg read → `{ autoupdates: bool, email_notifications: bool, skip_email: bool }` from `Utils::is_set_to_autoupdate()`, `Utils::is_set_to_email_notifications()`, and `defined('JETPACK_BETA_SKIP_EMAIL')`.

- [ ] **Step 5: Run lint** on the new file:

```bash
pnpm jetpack lint php --filename projects/plugins/beta/src/abilities/class-beta-abilities.php
```

Expected: no errors (fix phpcs spacing/escaping as needed).

- [ ] **Step 6: Commit**

```bash
git add projects/plugins/beta/src/abilities/class-beta-abilities.php
git commit -m "Jetpack Beta: add read abilities (list-plugins, get-plugin, get-settings)"
```

### Task 3: `Beta_Abilities` write abilities + wiring

**Files:**
- Modify: `src/abilities/class-beta-abilities.php`, `jetpack-beta.php`, `src/class-admin.php`

- [ ] **Step 1: `spec_activate_branch()` + `activate_branch()`.** Input: `{ slug, source, id }`. Resolve `Plugin::get_plugin( $slug )`, then call `$plugin->install_and_activate( $source, $id )` — the exact logic the nonce handler in `Admin::admin_page_load()` runs. Return `{ success: true, plugin: <get_plugin payload> }` on success, or the `WP_Error` on failure. Annotations: `readonly:false, destructive:false, idempotent:false`; `show_in_rest:true`; `mcp:{ public:false }`. `permission_callback` = `can_manage` + the same network-admin guard as `get-plugin`.

- [ ] **Step 2: `spec_update_settings()` + `update_settings()`.** Input: partial `{ autoupdates?: bool, email_notifications?: bool }`. For each provided key, replicate the toggle logic from `Admin::admin_page_load()`:
  - `autoupdates`: `update_option( 'jp_beta_autoupdate', (int) $value )`; when newly enabled, call `Hooks::maybe_schedule_autoupdate()`.
  - `email_notifications`: ignore when `JETPACK_BETA_SKIP_EMAIL` is defined; else `update_option( 'jp_beta_email_notifications', (int) $value )`.
  Return the `get-settings` payload. Annotations: write, non-idempotent.

- [ ] **Step 2b: Refactor (DRY).** Extract the option-mutation bodies from `Admin::admin_page_load()` into small static helpers (or call the ability execute methods) so the legacy GET handler and the ability share one implementation. Keep `admin_page_load()`'s nonce handling for any still-server-driven path, but the toggles/activate links are going away with the templates (Task 8) — leave `admin_page_load()` for the access-control redirect only.

- [ ] **Step 3: Wire init in `jetpack-beta.php`.** After the autoloader require and `Hooks::setup();`, add:

```php
add_action( 'plugins_loaded', array( Automattic\JetpackBeta\Abilities\Beta_Abilities::class, 'init' ), 20 );
```

- [ ] **Step 4: Lint**

```bash
pnpm jetpack lint php --filename projects/plugins/beta/src/abilities/class-beta-abilities.php --filename projects/plugins/beta/jetpack-beta.php --filename projects/plugins/beta/src/class-admin.php
```

- [ ] **Step 5: Commit**

```bash
git add projects/plugins/beta/src/abilities/class-beta-abilities.php projects/plugins/beta/jetpack-beta.php projects/plugins/beta/src/class-admin.php
git commit -m "Jetpack Beta: add write abilities (activate-branch, update-settings) and wire init"
```

### Task 4: PHP unit test for abilities

**Files:**
- Create: `tests/php/abilities/Beta_Abilities_Test.php`
- Reference: `projects/packages/connection/tests/php/abilities/Connection_Abilities_Test.php`, `projects/plugins/boost/tests/php/abilities/Boost_Abilities_Test.php`

- [ ] **Step 1: Write tests** covering: (a) after firing `wp_abilities_api_categories_init` + `wp_abilities_api_init`, all five abilities are registered (`wp_get_ability( 'jetpack-beta/...' )` non-null); (b) each ability's `permission_callback` returns false for a subscriber and true for an `update_plugins`-capable user; (c) `get-settings` returns the expected shape. Follow the harness/bootstrap used by the reference tests. Per project convention, **do not run PHPUnit locally — CI runs it.**

- [ ] **Step 2: Commit**

```bash
git add projects/plugins/beta/tests/php/abilities/Beta_Abilities_Test.php
git commit -m "Jetpack Beta: add Beta_Abilities registration/permission tests"
```

---

## Phase 2 — React app

### Task 5: App scaffold — bootstrap, AdminPage chrome, routing, API client

**Files:**
- Create: `src/js/index.tsx`, `src/js/app.tsx`, `src/js/api/abilities.ts`, `src/js/api/types.ts`, `src/js/style.scss`
- Modify: `src/class-admin.php` (`render()` + `admin_enqueue_scripts()`)

- [ ] **Step 1: PHP — `render()` prints root + bootstrap.** Replace the `require ...template.php` branches in `Admin::render()` with: print `<div id="jetpack-beta-root"></div>`, and enqueue/localize in `admin_enqueue_scripts()`. Read the build's `index.asset.php` for dependencies/version (standard Jetpack pattern — see how Protect enqueues `build/index.js`). Localize:

```php
wp_localize_script(
	'jetpack-beta-app',
	'JetpackBeta',
	array(
		'apiRoot'  => esc_url_raw( rest_url() ),
		'apiNonce' => wp_create_nonce( 'wp_rest' ),
		'plugin'   => isset( $_GET['plugin'] ) ? sanitize_text_field( wp_unslash( $_GET['plugin'] ) ) : null,
		'adminUrl' => Utils::admin_url(),
		'canManage'=> current_user_can( 'update_plugins' ),
	)
);
```

Drop the old `wp_enqueue_style('jetpack-beta-admin', 'admin/admin.css' ...)` and `admin.js` enqueues.

- [ ] **Step 2: `src/js/api/abilities.ts`** — typed client over the run route:

```ts
import apiFetch from '@wordpress/api-fetch';

const run = < T >( ability: string, data: Record< string, unknown > = {} ): Promise< T > =>
	apiFetch< T >( {
		path: `/wp-abilities/v1/abilities/${ ability }/run`,
		method: 'POST',
		data,
	} );

export const listPlugins = () => run< PluginListItem[] >( 'jetpack-beta/list-plugins' );
export const getPlugin = ( slug: string ) => run< PluginView >( 'jetpack-beta/get-plugin', { slug } );
export const getSettings = () => run< Settings >( 'jetpack-beta/get-settings' );
export const activateBranch = ( slug: string, source: string, id: string ) =>
	run< { success: boolean; plugin: PluginView } >( 'jetpack-beta/activate-branch', { slug, source, id } );
export const updateSettings = ( patch: Partial< Settings > ) =>
	run< Settings >( 'jetpack-beta/update-settings', patch );
```

Define `PluginListItem`, `PluginView`, `BranchCard`, `Settings` in `src/js/api/types.ts` to match the ability output schemas from Tasks 2–3.

- [ ] **Step 3: `src/js/index.tsx`** — set `apiFetch` root/nonce from `window.JetpackBeta`, then render `<App />` into `#jetpack-beta-root`:

```tsx
import apiFetch from '@wordpress/api-fetch';
import { createRoot } from '@wordpress/element';
import App from './app';
import './style.scss';

const boot = window.JetpackBeta;
apiFetch.use( apiFetch.createRootURLMiddleware( boot.apiRoot ) );
apiFetch.use( apiFetch.createNonceMiddleware( boot.apiNonce ) );

const el = document.getElementById( 'jetpack-beta-root' );
if ( el ) {
	createRoot( el ).render( <App /> );
}
```

- [ ] **Step 4: `src/js/app.tsx`** — `AdminPage` shell + screen switch on `window.JetpackBeta.plugin`. Use `@automattic/jetpack-components` `AdminPage` with `title="Beta Tester"`, a `subTitle`, `apiRoot`/`apiNonce` from bootstrap, and `breadcrumbs` when on the manage screen. Render `<PluginList />` when no `plugin`, else `<PluginManage slug={plugin} />`. (Components built in Tasks 6–7; for this task stub them as `() => null` so it compiles.)

- [ ] **Step 5: Typecheck + build**

```bash
cd projects/plugins/beta && pnpm run build && pnpm run typecheck
```

Expected: `build/index.js` + `build/index.asset.php` produced, typecheck clean. **Verify `@wordpress/ui` exports a toggle/switch** (`Form`/Switch). If not, plan to import `ToggleControl` from `@wordpress/components` in Task 7.

- [ ] **Step 6: Commit**

```bash
git add projects/plugins/beta/src/js projects/plugins/beta/src/class-admin.php
git commit -m "Jetpack Beta: React app scaffold with AdminPage chrome and abilities client"
```

### Task 6: `PluginList` screen (landing)

**Files:**
- Create: `src/js/screens/plugin-list.tsx`, `src/js/components/global-toggles.tsx`

- [ ] **Step 1:** `PluginList` fetches `listPlugins()` on mount (loading + error states via `Notice`). Render each plugin as a `@wordpress/ui` `Card` row: name, current version/state (with a `Badge` for active dev/stable), and a "Manage" `Button` linking to `?page=jetpack-beta&plugin=<slug>`. Render `GlobalToggles` above the list. Match the data/labels from `plugin-select.template.php`.

- [ ] **Step 2:** `GlobalToggles` fetches `getSettings()` and renders the Autoupdates + Email Notifications toggles (toggle primitive per Task 5 Step 5 finding). Calls `updateSettings()` optimistically, rolls back + shows a `Notice` on error. Hide the email toggle when `!autoupdates` or `skip_email` (mirrors `Admin::show_toggle_emails()`).

- [ ] **Step 3: Build + typecheck + lint JS**

```bash
cd projects/plugins/beta && pnpm run build && pnpm run typecheck && cd ../../.. && pnpm jetpack lint js projects/plugins/beta/src/js
```

- [ ] **Step 4: Commit** (`Jetpack Beta: implement plugin-list screen and global toggles`)

### Task 7: `PluginManage` screen

**Files:**
- Create: `src/js/screens/plugin-manage.tsx`, `src/js/components/branch-card.tsx`, `src/js/components/branch-section.tsx`, `src/js/components/markdown-panel.tsx`

- [ ] **Step 1:** `PluginManage` fetches `getPlugin(slug)` (loading/error states). Layout, top → bottom, mirroring `plugin-manage.template.php`:
  1. "Currently Running" `Card` (when `currently_running`) + "Found a bug? Report it!" `Button` (`bug_report_url`).
  2. mu-plugin info `Notice` when `is_mu_plugin`.
  3. Branch sections via `BranchSection`: stable, rc, trunk, then PR section (with search) and Releases section (with search).
  4. "To Test" and "What changed" `CollapsibleCard`s via `MarkdownPanel` (renders sanitized HTML with `dangerouslySetInnerHTML`).
- [ ] **Step 2:** `BranchSection` renders a heading, an optional controlled search `<input>` that filters its `BranchCard`s client-side by branch/version text (replaces `admin.js` indexing), and the list of cards.
- [ ] **Step 3:** `BranchCard` shows branch name/version, an active `Badge` when `is_active`, and an "Activate" `Button`. On click → `activateBranch(slug, source, id)` with a button-level busy state ("Activating…"); on success refetch `getPlugin(slug)` and update; on error show a `Notice` with the message. Mirror the label localization from the old `wp_localize_script` (`Activate`/`Activating…`/`Failed`).
- [ ] **Step 4:** Breadcrumbs — pass `[{ label: 'Jetpack Beta Tester', href: adminUrl }, { label: pluginName }]` to `AdminPage` (lift `pluginName` into `app.tsx` or render `AdminPage` inside the screen — follow the activity-log pattern).
- [ ] **Step 5: Build + typecheck + lint** (same commands as Task 6 Step 3).
- [ ] **Step 6: Commit** (`Jetpack Beta: implement plugin-manage screen with branch activation`)

### Task 8: Remove legacy UI

**Files:**
- Delete: `src/admin/plugin-select.template.php`, `src/admin/plugin-manage.template.php`, `src/admin/branch-card.template.php`, `src/admin/header.template.php`, `src/admin/toggles.template.php`, `src/admin/show-needed-updates.template.php`, `src/admin/admin.js`, `src/admin/updates.js`, `src/admin/admin.css`
- Keep: `src/admin/notice.template.php`, `src/admin/exception.template.php`
- Modify: `src/class-admin.php`

- [ ] **Step 1: Delete** the files above with `git rm`.
- [ ] **Step 2: Clean `src/class-admin.php`** — remove now-dead methods/requires that referenced deleted templates (`to_test_content` stays — it's used by the ability; `show_toggle*` go; `render_banner` keeps `notice.template.php`). Ensure `render()`/`admin_enqueue_scripts()` only do the React path. Confirm `.gitattributes`/`.phpcs.dir.xml` don't reference removed files.
- [ ] **Step 3: Lint PHP** (`pnpm jetpack lint php --filename projects/plugins/beta/src/class-admin.php`).
- [ ] **Step 4: Commit** (`Jetpack Beta: remove legacy PHP templates, vanilla JS, and hand-rolled CSS`)

### Task 9: Changelog + final validation

- [ ] **Step 1: Changelog** — from repo root, use the jetpack-changelog skill / changelogger:

```bash
cd projects/plugins/beta && composer changelog:add --no-interaction -- --type=changed --significance=minor --entry="Modernized the Beta Tester admin UI with a React interface built on the WordPress design system and the Abilities API."
```

(Adjust to the changelogger invocation the repo uses; verify a file lands in `projects/plugins/beta/changelog/`.)

- [ ] **Step 2: Full validation**

```bash
cd projects/plugins/beta && pnpm run build && pnpm run typecheck
cd ../../.. && pnpm jetpack lint js projects/plugins/beta/src/js && pnpm jetpack lint php --filename projects/plugins/beta/src/abilities/class-beta-abilities.php
```

- [ ] **Step 3: Commit** (`Jetpack Beta: add changelog entry`)

---

## Phase 3 — Ship to Jurassic Ninja

### Task 10: Deploy + screenshots

- [ ] **Step 1:** Capture **before** screenshots of both screens on trunk (the current UI) for the PR — use the jetpack-screenshot skill or the existing `blaze-before.png` convention.
- [ ] **Step 2:** Build the plugin and provision/rsync to a fresh Jurassic Ninja site via the **jetpack-test-jurassic-ninja** skill; Jetpack-connect; force dev autoloading.
- [ ] **Step 3:** Capture **after** screenshots of the plugin-list and plugin-manage screens (header, footer, branch cards, toggles, activate flow).
- [ ] **Step 4:** Report the autologin URL and attach before/after screenshots.

---

## Notes / risks (carried from spec)

- **Toggle primitive:** confirm `@wordpress/ui` switch availability in Task 5 Step 5; fall back to `@wordpress/components` `ToggleControl` for toggles only.
- **Synchronous activate** over REST (10–30s) — handled with button busy state; matches current behavior.
- **`init()` bypasses the global rollout filter** deliberately (only Beta's own abilities register).
- **Network/multisite access control** from `Admin::admin_page_load()` must be preserved in the `get-plugin`/`activate-branch` permission callbacks.
