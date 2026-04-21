# WordPress.com Fatal-Error Experience

Replaces WordPress's default "There has been a critical error on this website"
screen with a WordPress.com-branded version, and offers admins a one-click
path to deactivate the offending plugin.

## What the screen shows

**Anonymous visitor**

> This site is temporarily unavailable.
> We're aware of the issue and the site owner has been notified. Please check back soon.

**Logged-in admin**

- Headline explaining a critical error occurred.
- **Likely cause** — red notice card naming the plugin (from the error's file
  path), with version and description pulled from the plugin header, plus a
  red **Deactivate** button that drops the plugin from `active_plugins` in
  one click.
- **What you can try next** — recovery mode entry (when available), contact
  support link.
- **Error details** — collapsible panel with `Type: message in file:line`.

## File layout

| File | Purpose |
| --- | --- |
| `load.php` | Entry point; `require`s the three pieces below. |
| `fatal-error-screen.php` | Filter on `wp_php_error_message` + render functions. Template only — no business logic. |
| `fatal-error-helpers.php` | Pure helpers: viewer detection, plugin identification, URL builders, error formatter. Testable in isolation. |
| `fatal-error-screen.css` | Styles, inlined into the page at render time. |
| `fatal-plugin-deactivator.php` | Early-running endpoint that validates the signed deactivation URL and short-circuits the broken plugin. |
| `mu-plugin-stub.php` | Top-level mu-plugin stub that re-includes `fatal-plugin-deactivator.php` before any regular plugin loads. |

## Architecture notes

### Why not a drop-in (`wp-content/php-error.php`)

A drop-in would fully replace core's fatal template, but would also have to
re-implement core's recovery-mode email, locale resolution, and styling. The
`wp_php_error_message` filter lets us return rich HTML without reinventing
any of that. Trade-off: we can't replace core's outer `<body>` chrome, only
the inner message.

### Why helpers bootstrap WP manually

The fatal handler can fire before `wp-settings.php` finishes. At that point
cookie constants (`LOGGED_IN_COOKIE` etc.) aren't defined and
`pluggable.php` hasn't loaded, so `wp_validate_auth_cookie()` /
`current_user_can()` don't exist. The helpers call `wp_cookie_constants()`
and require the user/capability files on demand, wrapped in `try/catch`
because the fatal may itself be DB-related.

### Deactivation security model

The deactivation URL is HMAC-signed (using `AUTH_SALT` and the current
logged-in cookie) and expires after 10 minutes. Nonces aren't used because
the endpoint runs before `pluggable.php` is loaded.

### Why the mu-plugin stub is required

The deactivation endpoint must run **before** any plugin that might fatal.
If we only load the endpoint from `wpcomsh.php`, the broken plugin can
fatal alphabetically before wpcomsh is reached. Deploying
`mu-plugin-stub.php` into `wp-content/mu-plugins/` guarantees early load.

## Testing

1. Trigger a fatal from a plugin, e.g. a throwaway mu-plugin:
   ```php
   add_action( 'init', function () { trigger_error( 'boom', E_USER_ERROR ); } );
   ```
2. Visit the site as:
   - Anonymous (incognito): short apology, no technical detail.
   - Admin: full screen with Likely cause, Deactivate, next steps,
     collapsible error details.
3. As admin, click **Deactivate** — site should load on the next request,
   and the plugin should be absent from `active_plugins`.
