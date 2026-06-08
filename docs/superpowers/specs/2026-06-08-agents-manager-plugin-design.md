# Agents Manager dev/test plugin — Design

**Date:** 2026-06-08
**Status:** Approved (design)

## Background

PR [#49202](https://github.com/Automattic/jetpack/pull/49202) extracted the
`agents-manager` feature out of `jetpack-mu-wpcom` into a standalone Composer
package, `automattic/jetpack-agents-manager`
(`projects/packages/agents-manager/`). `jetpack-mu-wpcom` now consumes it via:

```php
if ( class_exists( 'Automattic\Jetpack\Agents_Manager\Agents_Manager' ) ) {
    \Automattic\Jetpack\Agents_Manager\Agents_Manager::init();
}
```

With the feature now living in a package rather than the mu-wpcom feature tree,
we no longer have a way to load and exercise it as a standalone plugin. This
spec covers a **minimal dev/test plugin** that loads the package so it can be
run and tested independently of `jetpack-mu-wpcom`.

## Goals

- A thin WordPress plugin in `projects/plugins/` that loads the
  `automattic/jetpack-agents-manager` package and initializes it.
- Builds within the Jetpack monorepo using the standard Jetpack autoloader.

## Non-goals (YAGNI)

- Not a released/mirrored plugin: **no** `autotagger`, `autorelease`,
  `mirror-repo`, `beta-plugin-slug`, or `readme.txt`.
- No JS/build tooling (`package.json`, webpack, jest).
- No PHPUnit harness.
- No My Jetpack registration, connection UI, or `jetpack-config` stack. The
  plugin relies on a WordPress.com connection already being present on the site
  (e.g. from Jetpack or `jetpack-mu-wpcom`).

## Naming

- **Folder:** `projects/plugins/agents-manager/`
- **Slug:** `agents-manager`
- **Composer name:** `automattic/agents-manager-plugin`
- **Text domain:** `agents-manager`
- **Constants:** `AGENTS_MANAGER_DIR`, `AGENTS_MANAGER_ROOT_FILE`, `AGENTS_MANAGER_SLUG`

(Convention note: released Jetpack plugins use a `jetpack-`-prefixed slug; this
plugin intentionally drops the prefix because it is not released.)

## Components

### 1. `agents-manager.php` (main plugin file, matches slug)

- Standard WordPress plugin header: Plugin Name "Jetpack Agents Manager",
  Description, Version `0.1.0-alpha`, Author Automattic, License GPLv2+,
  Text Domain `agents-manager`, `@package automattic/agents-manager-plugin`.
- `if ( ! defined( 'ABSPATH' ) ) { exit( 0 ); }` guard.
- Define `AGENTS_MANAGER_DIR`, `AGENTS_MANAGER_ROOT_FILE`, `AGENTS_MANAGER_SLUG`.
- Require the Jetpack autoloader at `AGENTS_MANAGER_DIR . 'vendor/autoload_packages.php'`:
  - On success, alias textdomains via
    `\Automattic\Jetpack\Assets::alias_textdomains_from_file()` when available
    (mirrors starter-plugin).
  - On failure, log a `WP_DEBUG` error and bail gracefully (admin-notice style
    fallback like starter-plugin, minus the My Jetpack red-bubble hook).
- Hook initialization on `plugins_loaded`:

  ```php
  add_action( 'plugins_loaded', function () {
      if ( class_exists( \Automattic\Jetpack\Agents_Manager\Agents_Manager::class ) ) {
          \Automattic\Jetpack\Agents_Manager\Agents_Manager::init();
      }
  } );
  ```

  `Agents_Manager::init()` is a singleton; its constructor registers the
  `rest_api_init`, `admin_enqueue_scripts`, `wp_enqueue_scripts`, and
  `next_admin_init` hooks itself, so `plugins_loaded` is early enough.

### 2. `composer.json`

```json
{
  "name": "automattic/agents-manager-plugin",
  "description": "Standalone plugin that loads the Jetpack Agents Manager package.",
  "type": "wordpress-plugin",
  "license": "GPL-2.0-or-later",
  "require": {
    "automattic/jetpack-agents-manager": "@dev",
    "automattic/jetpack-autoloader": "@dev",
    "automattic/jetpack-composer-plugin": "@dev"
  },
  "repositories": [
    {
      "type": "path",
      "url": "../../packages/*",
      "options": { "monorepo": true }
    }
  ],
  "minimum-stability": "dev",
  "prefer-stable": true,
  "config": {
    "allow-plugins": {
      "automattic/jetpack-autoloader": true,
      "automattic/jetpack-composer-plugin": true
    },
    "autoloader-suffix": "<unique>_agents_managerⓥ0_1_0"
  }
}
```

No `extra.autotagger`/`autorelease`/`mirror-repo` keys (not released).

### 3. `changelog/initial-version`

Changelogger entry (all Jetpack projects require a changelog dir):

```
Significance: minor
Type: added

Initial version: standalone plugin that loads the Jetpack Agents Manager package.
```

### 4. `.gitignore`

Ignore build/vendor artifacts: `vendor/`, `jetpack_vendor/`, `node_modules/`,
`composer.lock` per other plugin conventions (verify against an existing
plugin's `.gitignore` at implementation time).

## Build / verification

- From `projects/plugins/agents-manager/`, `composer install` resolves the path
  repositories and generates `vendor/autoload_packages.php` plus the
  `jetpack_vendor/` tree.
- Activating the plugin on a connected site loads the package without fatals and
  registers the agents-manager REST routes (e.g. the persisted `open-state`
  endpoint), matching the behavior previously provided by `jetpack-mu-wpcom`.

## Open questions

None outstanding.
