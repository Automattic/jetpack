# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Essential Documentation

**Primary Reference**: [Social Plugin README.md](./README.md) - Plugin overview and setup

**Related Packages**:

- [Publicize Package AGENTS.md](../../packages/publicize/AGENTS.md) - Core library documentation (most Social logic lives here)
- [Automated Testing Overview](../../../docs/automated-testing.md) - Testing patterns
- [Coding Standards & Guidelines](../../../docs/coding-guidelines.md) - Development best practices

## Project Overview

Jetpack Social is a standalone WordPress plugin that enables automatic sharing of posts to social media networks. It is a **thin orchestration layer** — nearly all business logic lives in the Publicize package (`projects/packages/publicize/`).

Key characteristics:
- **No JS build of its own** — all frontend code comes from the Publicize package
- **Bootstraps Jetpack packages** via the Config pattern (`Automattic\Jetpack\Config`)
- **Requires a WordPress.com connection** to function (sharing happens server-side via WPCOM)

## Architecture

### Boot Sequence

1. `jetpack-social.php` — Entry point: autoloader, constants, instantiates `Jetpack_Social`
2. `Jetpack_Social::__construct()` — Sets up connection auth, registers hooks, initializes services
3. On `plugins_loaded` (priority 1): Ensures `connection`, `sync`, `identity_crisis`, and `publicize` packages via `Config`
4. Publicize package is only loaded when the site has an active WordPress.com connection

### Package Dependencies

The plugin delegates to these Jetpack packages:
- **`publicize`** — Core sharing logic, REST API, block editor UI
- **`connection`** — WordPress.com connection management
- **`sync`** — Data synchronization with WPCOM
- **`my-jetpack`** — Jetpack product management dashboard

## Key Classes (`src/`)

- **`Jetpack_Social`** (`class-jetpack-social.php`) — Main plugin class. Handles activation, module management, connection checks, and package configuration
- **`Meta_Tags`** (`class-meta-tags.php`) — Renders Open Graph and social meta tags in `wp_head`
- **`Note`** (`class-note.php`) — Social Notes custom post type (short-form social content)
- **`REST_Settings_Controller`** (`class-rest-settings-controller.php`) — Plugin-level REST settings endpoint
- **`Social_Shares`** (`class-social-shares.php`) — Share count tracking and `[jp_shares_shortcode]` shortcode

## Plugin Patterns

### Module Activation

The plugin activates the `publicize` module via `Automattic\Jetpack\Modules`. On first activation, it sets an option flag (`jetpack-social_activated`) via `add_option` that triggers module activation on the next `admin_init`, then removes it with `delete_option`.

### Connection Checks

`Jetpack_Social::is_connected()` checks both site registration and user connection via `Connection_Manager`. The Publicize package is only configured when connected.

### Plan Checks

`Jetpack_Social::has_paid_plan()` uses `Current_Plan::supports('social-shares-1000')` to determine paid vs free tier.

## Testing

### PHP Tests

```bash
jetpack test php plugins/social       # Run PHPUnit tests
jetpack test php plugins/social -v    # Verbose output
```

Test files are in `tests/php/`.

### E2E Tests

```bash
jetpack test e2e plugins/social       # Run E2E tests (Playwright)
```

E2E tests are in `tests/e2e/`. These test the full plugin flow including connection setup and sharing.
