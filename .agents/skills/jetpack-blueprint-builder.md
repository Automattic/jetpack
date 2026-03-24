---
description: Create WordPress Playground blueprints for Jetpack that activate specific modules. Use when the user asks to create a blueprint, playground blueprint, activate modules in playground, or set up a Playground environment for a Jetpack package/feature.
---

# Jetpack Blueprint Builder

Create `blueprint.json` files for use with `jetpack playground jetpack --blueprint=<path>`.

## What the CLI Already Handles

The `jetpack playground` command (`tools/cli/commands/playground.js`) automatically:
- Sets the base blueprint with `$schema`, `login: true`, `features.networking: true`
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

## Available Module Slugs

These are the directory names in `projects/plugins/jetpack/modules/`:

| Slug | Description |
|------|-------------|
| `account-protection` | Account protection |
| `blaze` | Blaze advertising |
| `blocks` | Jetpack blocks |
| `canonical-urls` | Canonical URLs |
| `carousel` | Image carousel |
| `comment-likes` | Comment likes |
| `comments` | Jetpack comments |
| `contact-form` | Forms (contact, registration, feedback) |
| `copy-post` | Copy post |
| `custom-content-types` | Custom content types (testimonials, portfolios) |
| `google-fonts` | Google Fonts |
| `gravatar-hovercards` | Gravatar hovercards |
| `infinite-scroll` | Infinite scroll |
| `json-api` | JSON API |
| `latex` | LaTeX |
| `likes` | Likes |
| `markdown` | Markdown |
| `monitor` | Downtime monitoring |
| `notes` | Notifications |
| `photon` | Photon image CDN |
| `photon-cdn` | Photon CDN (Site Accelerator) |
| `post-by-email` | Post by email |
| `post-list` | Post list enhancements |
| `protect` | Brute force protection |
| `publicize` | Publicize (social sharing) |
| `related-posts` | Related posts |
| `search` | Jetpack Search |
| `seo-tools` | SEO tools |
| `sharedaddy` | Sharing buttons |
| `shortcodes` | Shortcode embeds |
| `shortlinks` | WP.me shortlinks |
| `simple-payments` | Simple payments |
| `sitemaps` | Sitemaps |
| `sso` | WordPress.com SSO |
| `stats` | Jetpack Stats |
| `subscriptions` | Subscriptions/newsletters |
| `theme-tools` | Theme tools |
| `tiled-gallery` | Tiled galleries |
| `vaultpress` | VaultPress backup |
| `verification-tools` | Site verification |
| `videopress` | VideoPress |
| `waf` | Web Application Firewall |
| `widget-visibility` | Widget visibility |
| `widgets` | Extra widgets |
| `woocommerce-analytics` | WooCommerce analytics |
| `wordads` | WordAds |

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

- Package blueprints: `projects/packages/<name>/blueprint.json`
- Plugin blueprints: `projects/plugins/<name>/.wordpress-org/blueprints/blueprint.json` (auto-detected by CLI)
- Custom path: pass via `--blueprint=<path>` flag

## Running

```bash
# Plugin with auto-detected blueprint
jetpack playground jetpack

# Plugin with custom blueprint
jetpack playground jetpack --blueprint=projects/packages/forms/blueprint.json

# With debug mode
jetpack playground jetpack --blueprint=projects/packages/forms/blueprint.json --debug
```
