# Jetpack WP Build Polyfills

Polyfills for WordPress Core packages not yet available in WordPress < 7.0.

This package conditionally registers `@wordpress/*` packages as both classic scripts (IIFE) and script modules (ESM) when they are not already provided by Core or Gutenberg.
It is intended to be used until WordPress 7.1 is released, at which point versions of WordPress < 7.0 will no longer be supported and this package will no longer be needed.

## Problem

WordPress 7.0 introduces several new packages (`@wordpress/boot`, `@wordpress/route`, `@wordpress/theme`, etc.) that plugins built with [`@wordpress/build`](https://github.com/WordPress/gutenberg/tree/trunk/packages/wp-build) depend on. On older WordPress versions, these packages are missing or ship incomplete implementations — for example, `wp-private-apis` has an allowlist that rejects `@wordpress/theme` and `@wordpress/route`, and `wp-notices` lacks component exports that `@wordpress/boot` requires.

This package provides those missing packages so that plugins using `@wordpress/build` can work on WordPress versions before 7.0.

## What it polyfills

### Classic scripts (IIFE)

| Handle            | Source package          | Force-replaced on WP < 7.0? |
|-------------------|------------------------|------------------------------|
| `wp-notices`      | `@wordpress/notices`    | Yes — missing component exports |
| `wp-private-apis` | `@wordpress/private-apis` | Yes — incomplete allowlist |
| `wp-theme`        | `@wordpress/theme`      | No — only registered if absent |

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
3. For classic scripts, it checks whether the handle is already registered. Scripts marked as `force` are deregistered and re-registered with the polyfill version. Non-force scripts are skipped if already registered.
4. For script modules, it calls `wp_register_script_module()`, which silently ignores duplicates.

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

## Boot module asset proxy

Packages that use `@wordpress/build` to generate pages get a hardcoded reference to `build/modules/boot/index.min.asset.php` in the generated page templates. This file provides the classic script dependencies and version hash needed to bootstrap the page.

When `@wordpress/build` stops bundling the boot module (as planned in upcoming Gutenberg changes), this asset file will no longer be generated. The polyfills package ships a proxy file (`src/boot-module-asset-proxy.php`) that resolves the asset data from this package's build output at runtime, using `ReflectionClass` to locate the package regardless of install path (`vendor/` or `jetpack_vendor/`).

The Jetpack monorepo CLI (`jetpack build`) automatically copies this proxy to the expected location (`build/modules/boot/index.min.asset.php`) after building any package that has `build/pages/` and depends on this package. No per-consumer configuration is needed.

## Development

```bash
# Build polyfills (development)
pnpm run build

# Build polyfills (production)
pnpm run build-production

# Run PHP tests
composer run test-php
```
