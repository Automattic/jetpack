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

Call `register()` early in your plugin — for example, during the main plugin file load:

```php
\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::register();
```

The version threshold for force-replacements can be overridden:

```php
\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::register( '7.1' );
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
