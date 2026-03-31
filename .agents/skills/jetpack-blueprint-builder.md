---
description: Create WordPress Playground blueprints for the Jetpack plugin that activate specific modules. Use when the user asks to create a blueprint or Playground environment for Jetpack modules (e.g., Forms, Stats, Search). Only applies to the Jetpack plugin's module system, not standalone plugins like Social or Boost.
---

# Jetpack Blueprint Builder

Create `blueprint.json` files for use with `jetpack playground jetpack --blueprint=<path>`.

## What the CLI Already Handles

The `jetpack playground` command (`tools/cli/commands/playground.js`) automatically:
- Merges your blueprint with its base settings (`login: true`, `features.networking: true`). Include `$schema` in your blueprint for editor validation — the CLI won't duplicate it.
- Mounts the plugin directory and `projects/packages/` into Playground
- Defines `JETPACK_DEV_DEBUG: true` for offline mode (Jetpack plugin only)
- Writes a mu-plugin to fix `plugins_url()` for monorepo vendor symlinks
- Configures WP_DEBUG (off by default, on with `--debug` flag)
- Activates the plugin as the **last** step

Custom blueprint steps run **before** the CLI's auto-injected steps. This means you can set WordPress options that will be in place when Jetpack activates.

## How to Activate Jetpack Modules

Jetpack modules are controlled by the `jetpack_active_modules` option — a PHP array of module slugs stored in `wp_options`. Use the `setSiteOptions` blueprint step to set this before Jetpack activates:

```json
{
  "step": "setSiteOptions",
  "options": {
    "jetpack_active_modules": ["module-slug-1", "module-slug-2"]
  }
}
```

## Finding Module Slugs

Module slugs are the filenames (without `.php`) in `projects/plugins/jetpack/modules/`. Exclude helper files prefixed with `module-` (e.g., `module-extras.php`).

To discover available slugs, list the directory:
```bash
ls projects/plugins/jetpack/modules/*.php | xargs -I{} basename {} .php | grep -v '^module-'
```

Common examples: `contact-form`, `blocks`, `stats`, `publicize`, `search`, `subscriptions`, `videopress`.

## Blueprint Template

```json
{
  "$schema": "https://playground.wordpress.net/blueprint-schema.json",
  "landingPage": "/wp-admin/",
  "steps": [
    {
      "step": "setSiteOptions",
      "options": {
        "jetpack_active_modules": ["<module-slugs>"]
      }
    }
  ]
}
```

### Common `landingPage` values for modules

- Forms: `/wp-admin/admin.php?page=jetpack-forms`
- Stats: `/wp-admin/admin.php?page=stats`
- Search: `/wp-admin/admin.php?page=jetpack-search`
- Block editor with new post: `/wp-admin/post-new.php`
- Jetpack dashboard: `/wp-admin/admin.php?page=jetpack`

## Available Blueprint Steps

These are the steps you can use in `blueprint.json`:

- **`setSiteOptions`** — Set WordPress options (`update_option`). Values can be strings, numbers, booleans, arrays, or objects.
- **`defineWpConfigConsts`** — Define `wp-config.php` constants.
- **`writeFile`** — Write a file (e.g., mu-plugins for runtime hooks).
- **`runPHP`** — Execute PHP code (use `require_once 'wordpress/wp-load.php';` for WP functions).
- **`installPlugin`** — Install a plugin from wordpress.org, URL, or bundled zip.
- **`activatePlugin`** — Activate a plugin by path.
- **`login`** — Auto-login (handled by CLI already).
- **`wp-cli`** — Run a WP-CLI command.
- **`importWxr`** — Import WordPress XML content.

## Where to Place Blueprints

- Package blueprints: `projects/packages/<name>/blueprints/<name>.json` (use a `blueprints/` subdirectory for multiple blueprints per package)
- Plugin blueprints: `projects/plugins/<name>/.wordpress-org/blueprints/blueprint.json` (auto-detected by CLI)
- Custom path: pass via `--blueprint=<path>` flag

## Running

```bash
# Plugin with auto-detected blueprint
jetpack playground jetpack

# Plugin with custom blueprint
jetpack playground jetpack --blueprint=projects/packages/forms/blueprints/form-blocks.json

# With debug mode
jetpack playground jetpack --blueprint=projects/packages/forms/blueprints/form-blocks.json --debug
```
