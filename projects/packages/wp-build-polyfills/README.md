# Jetpack WP Build Polyfills

Polyfills for WordPress Core packages not yet available or complete in older WordPress versions.

This package conditionally registers `@wordpress/*` packages as both classic scripts (IIFE) and script modules (ESM) when they are not already provided by Core or Gutenberg.
It is intended to be used while Jetpack supports WordPress versions whose bundled packages are missing or incomplete. Revisit this package once Jetpack's minimum supported WordPress version reaches 7.1.

## Problem

WordPress 7.0 introduces several new packages (`@wordpress/boot`, `@wordpress/route`, `@wordpress/theme`, etc.) that plugins built with [`@wordpress/build`](https://github.com/WordPress/gutenberg/tree/trunk/packages/wp-build) depend on. On older WordPress versions, these packages are missing or ship incomplete implementations — for example, `wp-private-apis` has an allowlist that rejects `@wordpress/theme`, `@wordpress/route`, and newer dashboard packages, and `wp-notices` lacks component exports that `@wordpress/boot` requires.

This package provides those missing or updated packages so that plugins using `@wordpress/build` can work across Jetpack's supported WordPress versions.

## What it polyfills

### Classic scripts (IIFE)

| Handle            | Source package          | Force-replaced? |
|-------------------|------------------------|-----------------|
| `wp-notices`      | `@wordpress/notices`    | Yes on WP < 7.0 — missing component exports |
| `wp-private-apis` | `@wordpress/private-apis` | Yes on WP < 7.1 unless Gutenberg >= 23.5.0 is active — incomplete allowlist |
| `wp-theme`        | `@wordpress/theme`      | No — only registered if absent |
| `wp-views`        | `@wordpress/views`      | No — only registered if absent |

### Script modules (ESM)

| Module ID          | Source package       |
|--------------------|----------------------|
| `@wordpress/boot`  | `@wordpress/boot`    |
| `@wordpress/route` | `@wordpress/route`   |
| `@wordpress/a11y`  | `@wordpress/a11y`    |

Script modules use "first-wins" semantics — if Core or Gutenberg already registered the module, the polyfill is silently ignored.

## How it works

1. `WP_Build_Polyfills::register()` hooks into `wp_default_scripts` at **priority 20**, after Core (priority 0) and Gutenberg (priority 10) have registered their scripts.
2. For each polyfill, it checks whether a built asset file exists (`build/scripts/*/index.asset.php` or `build/modules/*/index.asset.php`).
3. For classic scripts, it checks whether the handle is already registered. Scripts marked for force replacement are deregistered and re-registered with the polyfill version when the WordPress version is below the script's threshold and active Gutenberg is not known to provide a compatible implementation. Non-force scripts are skipped if already registered.
4. For script modules, it calls `wp_register_script_module()`, which silently ignores duplicates.

`wp-private-apis` has an additional Gutenberg-version guard because the dashboard packages require a private-apis allowlist that includes `@wordpress/widget-dashboard`. Gutenberg 23.4.0 and older do not include that allowlist entry; Gutenberg 23.5.0 is expected to be the first active-Gutenberg version that matches the current `@next` package build used here.

## Usage

Call `register()` early in your plugin, specifying a consumer name and the polyfills you need:

```php
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

WP_Build_Polyfills::register( 'my-plugin', array(
    'wp-notices',
    'wp-private-apis',
    '@wordpress/boot',
    '@wordpress/route',
) );
```

Available handles are listed in `WP_Build_Polyfills::SCRIPT_HANDLES` and `WP_Build_Polyfills::MODULE_IDS`.

Multiple plugins can call `register()` — the hook is only added once, and all requested polyfills are merged. You can inspect which consumers requested which polyfills via `WP_Build_Polyfills::get_consumers()`.

The version threshold for force-replacements can be overridden with a third parameter:

```php
WP_Build_Polyfills::register( 'my-plugin', array( 'wp-notices' ), '7.1' );
```

## Boot module asset file

Packages that use `@wordpress/build` to generate pages get a hardcoded reference to `build/modules/boot/index.min.asset.php` in the generated page templates. This file provides the classic script dependencies and version hash needed to bootstrap the page.

When `@wordpress/build` stops bundling the boot module (as planned in upcoming Gutenberg changes), this asset file will no longer be generated. This package builds its own boot module asset file, and ships a bin script (`provide-boot-asset-file`) that copies it to the expected location in the consumer's build directory.

Consuming packages should add `@automattic/jetpack-wp-build-polyfills` as a devDependency and call the script after `wp-build`:

```json
"build:boot-proxy": "provide-boot-asset-file"
```

## Development

```bash
# Build polyfills (development)
pnpm run build

# Build polyfills (production)
pnpm run build-production

# Run PHP tests
composer run test-php
```
