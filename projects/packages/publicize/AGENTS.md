# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Essential Documentation

**Primary Reference**: [Publicize README.md](./README.md) - Package overview and configuration

**Additional Resources**:

- [Automated Testing Overview](../../../docs/automated-testing.md) - Testing patterns and strategies
- [Coding Standards & Guidelines](../../../docs/coding-guidelines.md) - Development best practices
- [Jetpack HTTP API Documentation](../../../docs/rest-api.md) - REST API patterns
- [Jetpack CLI Documentation](../../../tools/cli/README.md) - CLI commands and workflows

## Project Overview

The Publicize package is the core library powering Jetpack Social. It provides the PHP backend and JS/TS frontend for sharing WordPress posts to social media networks. This package is consumed by both the **Social plugin** (`projects/plugins/social/`) and the **main Jetpack plugin** (`projects/plugins/jetpack/`).

The package has a dual codebase: PHP in `src/` and JS/TS in `_inc/`.

## Architecture

### Package Dependency Chain

```text
Social Plugin (or Jetpack Plugin)
  └── Publicize Package (this package) — core sharing logic, REST API, UI
        └── Social Previews (js-package) — platform preview components
```

### Initialization Flow

1. Consumer plugin calls `Config::ensure('publicize')` during `plugins_loaded`
2. `Publicize_Setup::configure()` registers the `jetpack_feature_publicize_enabled` hook
3. `Publicize_Setup::pre_initialization()` always loads assets and admin page (regardless of feature state)
4. `Publicize_Setup::on_jetpack_feature_publicize_enabled()` initializes REST controllers, SIG, and UI

### WPCOM Simple vs Jetpack Sites

The codebase handles two runtime environments:
- **WPCOM Simple**: `(new Host())->is_wpcom_simple()` — uses `wpcom_rest_api_v2_load_plugin()` for REST, `$publicize` global is pre-initialized
- **Jetpack sites**: Standard REST registration, `REST_Controller` loaded for legacy `jetpack/v4` namespace

## PHP Codebase (`src/`)

### Class Hierarchy

- **`Publicize_Base`** (abstract) — Core publicize logic: connection management, post meta handling, sharing eligibility checks
- **`Publicize`** extends `Publicize_Base` — Concrete implementation for Jetpack-connected sites
- **`Publicize_Setup`** — Static initialization orchestrator (entry point from Config package)
- **`Publicize_UI`** — Admin UI rendering and classic editor integration

### REST API Controllers (`src/rest-api/`)

Controllers extending `Base_Controller`:

- `Connections_Controller` — CRUD for social connections
- `Services_Controller` — Available social services list
- `Share_Post_Controller` — Trigger resharing for a post
- `Share_Status_Controller` — Check share results/status
- `Scheduled_Actions_Controller` — Manage scheduled shares
- `Social_Image_Generator_Controller` — SIG template/settings API

Other REST API components:

- `Connections_Post_Field` — Registers a REST field to add connections data to post responses (via `rest_api_init`)
- `Proxy_Requests` — Helper for proxying requests to WPCOM API endpoints

**REST namespaces**: `wpcom/v2/publicize/*` (primary, loaded via controllers above) and `jetpack/v4/publicize/*` (legacy, via `REST_Controller`, Jetpack sites only)

### Social Image Generator (`src/social-image-generator/`)

Auto-generates share images from post content. Key classes:
- `Setup` — Initialization and hooks
- `Settings` / `Post_Settings` — Global and per-post SIG configuration
- `Templates` — Image template definitions
- `REST_Settings_Controller` / `REST_Token_Controller` — API endpoints

### Jetpack Social Settings (`src/jetpack-social-settings/`)

`Settings` class — Manages global Social settings (auto-sharing, SIG defaults, UTM parameters) and exposes them via the WordPress Settings REST API (`show_in_rest`).

### Important Post Meta Keys

Defined as constants/properties on `Publicize_Base`:
- `_wpas_mess` — Custom share message
- `_wpas_feature_enabled` — Whether sharing is enabled for the post
- `_wpas_options` — Jetpack Social options (JSON)
- `_wpas_connection_overrides` — Per-connection customization
- `_wpas_skip_publicize_{id}` — Skip sharing to specific connection
- `_wpas_done_{id}` — Connection already shared to
- `_publicize_pending` — Post is queued for sharing
- `_publicize_done_external` — External IDs of completed shares

## JS/TS Codebase (`_inc/`)

### Entry Points (via `webpack.config.js`)

Webpack entry points (defined in `webpack.config.js`), bundled into `build/`:
- **`social-admin-page.tsx`** — Standalone Social admin dashboard
- **`block-editor-social.tsx`** — Block editor sidebar panel (Social plugin context)
- **`block-editor-jetpack.tsx`** — Block editor sidebar panel (Jetpack plugin context)
- **`classic-editor.js`** — Classic editor integration

### Redux Store (`_inc/social-store/`)

Store ID: `jetpack-social-plugin` (registered via `@wordpress/data`)

**Key slices** (matching action/selector/reducer files):
- `connection-data` — Social connections state
- `share-post` — Post sharing actions and status
- `share-status` — Share results tracking
- `scheduled-shares` — Scheduled share management
- `unified-modal` — Modal state for the unified sharing UI

**Other action/selector modules** (no dedicated reducer — use resolvers or derive from other state):
- `services`, `social-image-generator`, `social-module-settings`, `social-settings`
- `utm-settings`, `social-notes` — actions only; selectors are accessed via `social-settings`

Initial state is hydrated from `getSocialScriptData()` (PHP-localized data).

### Components (`_inc/components/`)

Components are organized by feature area:

- **Sharing UI**: `form/`, `panel/`, `share-buttons/`, `share-post-button/`, `manual-sharing/`, `resharing-panel/`
- **Connections**: `connection/`, `connection-management/`, `manage-connections-modal/`, `services/`
- **Post publishing**: `pre-publish-preview/`, `post-publish-manual-sharing/`, `post-publish-share-status/`
- **Media & Images**: `media-picker/`, `media-section/`, `generated-image-preview/`, `social-image-generator/`
- **Previews & Modals**: `social-previews/`, `social-post-modal/`, `unified-modal/`, `global-modals/`
- **Admin**: `admin-page/`, `block-editor/`, `schedule-button/`, `scheduled-posts/`, `share-status/`

### Hooks (`_inc/hooks/`)

Key hooks:
- `use-publicize-config` — Central config hook for sharing feature state
- `use-social-media-connections` — Connection data access
- `use-share-post` / `use-schedule-post` — Sharing actions
- `use-attached-media` / `use-featured-image` / `use-media-details` — Media handling
- `use-image-generator-config` / `use-post-can-use-sig` / `use-sig-preview` — SIG integration
- `use-post-meta` / `use-post-pre-publish-value` — Post data access
- `use-social-preview-post-data` / `use-connection-preview-data` — Preview data assembly

## Development Quick Reference

### Build & Watch

```bash
jetpack build packages/publicize        # Production build
jetpack build packages/publicize --deps # Build with dependencies
jetpack watch packages/publicize --hot  # Watch mode with HMR
```

### Testing

```bash
jetpack test php packages/publicize       # PHP tests (PHPUnit)
jetpack test js packages/publicize        # JS tests (Jest)
```

### Text Domain

PHP: `jetpack-publicize-pkg`
JS: Same domain, applied via `@automattic/babel-plugin-replace-textdomain` in webpack config
