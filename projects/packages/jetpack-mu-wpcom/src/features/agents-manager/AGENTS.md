# Agents Manager (Jetpack Backend)

## Overview

The Agents Manager backend in `jetpack-mu-wpcom` is responsible for loading the Agents Manager frontend bundles on WordPress.com sites and providing REST API endpoints for persisting UI state.

The frontend code lives in the Calypso repository (`packages/agents-manager/` and `apps/agents-manager/`). This feature only handles enqueueing and backend concerns.

## Files

| File | Purpose |
|------|---------|
| `agents-manager.php` | Entry point, requires the main class |
| `class-agents-manager.php` | Core class: script enqueueing, variant selection, admin bar, feature gating |
| `class-wp-rest-agents-manager-persisted-open-state.php` | REST controller for UI state persistence |

## Script Loading

### Variant Selection

The `get_variant()` method selects which bundle to load based on the current environment:

| Variant | Context |
|---------|---------|
| `gutenberg` | Block editor, connected to Jetpack |
| `gutenberg-disconnected` | Block editor, disconnected |
| `wp-admin` | Classic wp-admin, connected |
| `wp-admin-disconnected` | Classic wp-admin, disconnected |
| `ciab` | CIAB / Next Admin, connected |
| `ciab-disconnected` | CIAB / Next Admin, disconnected |

### Bundle Sources

All JS/CSS bundles are loaded from `widgets.wp.com/agents-manager/`:
- JavaScript: `agents-manager-{variant}.min.js`
- CSS: `agents-manager-{variant}.css` (with `.rtl.css` for RTL languages)
- Asset metadata: `agents-manager-{variant}.asset.json` (cached in transient for 1 hour)

### Enqueue Hooks

Scripts are enqueued via three hooks (all at priority 101, after Help Center at 100):
- `admin_enqueue_scripts` — wp-admin pages
- `wp_enqueue_scripts` — frontend pages (eligible editors only)
- `next_admin_init` (priority 1001) — CIAB / Next Admin

### Inline Data

The PHP injects `agentsManagerData` as inline script data containing:
- `agentProviders` — from `agents_manager_agent_providers` filter
- `useUnifiedExperience` — from `agents_manager_use_unified_experience` filter
- `isDevMode` — development environment detection
- `sectionName` — the variant name
- `currentUser` — user ID, username, display name, avatar, email
- `site` — site ID and domain
- `helpCenterUrl` — fallback URL for disconnected variants

## REST API

**Namespace:** `agents-manager`
**Route:** `/open-state`

### GET `/wp-json/agents-manager/open-state`

Retrieves the Agents Manager UI state from user preferences.

**Permission:** `is_user_logged_in`

**Response fields:**
- `agents_manager_open` (bool, default: false)
- `agents_manager_docked` (bool, default: false)
- `agents_manager_floating_position` (string, default: 'right')
- `agents_manager_router_history` (object|null, default: null)

### POST `/wp-json/agents-manager/open-state`

Updates the Agents Manager UI state. All parameters are optional; only provided parameters are updated.

**Permission:** `is_user_logged_in`

Both endpoints proxy to `/agents-manager/state` on wpcom via `Jetpack\Connection\Client::wpcom_json_api_request_as_user()`.

## Filters

| Filter | Purpose | Default |
|--------|---------|---------|
| `agents_manager_use_unified_experience` | Enable unified experience UI | `false` |
| `agents_manager_enabled_in_ciab` | Enable/disable in CIAB | `true` |
| `agents_manager_enabled_in_block_editor` | Enable/disable in block editor | `false` |
| `agents_manager_agent_providers` | Register extension provider module URLs | `[]` |

## Feature Gating

The `is_enabled()` method implements multi-level feature gates:
1. CIAB: always enabled (controllable via `agents_manager_enabled_in_ciab`)
2. Unified experience: enabled if `agents_manager_use_unified_experience` is true
3. Block editor only: if `agents_manager_enabled_in_block_editor` is true
4. Default: disabled

## Help Center Interaction

On Gutenberg pages, the Agents Manager dequeues Help Center scripts and styles to prevent duplicate UI. In classic wp-admin, it replaces the Help Center admin bar node with its own.

## Router History Cleanup

The `calypso_preferences_update` filter limits router history entries to 50. When exceeded, it keeps the last 49 entries and prepends a root entry to ensure the back button works.

## Development

This feature is loaded for WordPress.com-connected users via `Jetpack_Mu_Wpcom`. To develop:

1. Follow the standard [`jetpack-mu-wpcom` development process](https://github.com/Automattic/jetpack/blob/trunk/projects/packages/jetpack-mu-wpcom/README.md).
2. For frontend-only changes, work in the Calypso repo instead (`packages/agents-manager/` or `apps/agents-manager/`).
