# WordPress.com Fatal-Error Experience

Replaces WordPress's default "There has been a critical error on this website"
screen with a WordPress.com-branded version, and offers admins a one-click
path to deactivate the offending plugin.

## What the screen shows

**Anonymous visitor**

> This site is temporarily unavailable.
> We are aware of the issue and the site owner has been notified. Please check back soon.

**Logged-in admin**

- Headline explaining a critical error occurred.
- **Likely cause** — red notice card naming the plugin (from the error's file
  path), with version and description pulled from the plugin header, plus a
  red **Deactivate** button that drops the plugin from `active_plugins` in
  one click.
- **What you can try next** — recovery mode entry (when available), contact
  support link.
- **Error details** — collapsible panel with the raw PHP error message.

## File layout

| File | Purpose |
| --- | --- |
| `load.php` | Entry point; `require`s the three pieces below. |
| `fatal-error-screen.php` | Filter on `wp_php_error_message` + render functions. Template only — no business logic. |
| `fatal-error-helpers.php` | Pure helpers: viewer detection, plugin identification, signed-form/recovery URL builders. Testable in isolation. |
| `fatal-error-screen.css` | Styles, inlined into the page at render time. |
| `fatal-plugin-deactivator.php` | Early-running endpoint that validates the signed deactivation POST, persists the change, and redirects. |
| `fatal-recovery-redirect.php` | Early-running endpoint behind the screen's "Enter recovery mode" link: logs `wpcomsh_fatal_recovery` and 302s to a fresh core recovery URL. |

## Architecture notes

### Why not a drop-in (`wp-content/php-error.php`)

A drop-in would fully replace core's fatal template, but would also have to
re-implement core's recovery-mode email, locale resolution, and styling. The
`wp_php_error_message` filter lets us return rich HTML without reinventing
any of that. Trade-off: we can't replace core's outer `<body>` chrome, only
the inner message.

### Not OOMing while rendering the screen

Building the screen allocates — CSS read, output buffer, plugin-header reads,
user bootstrap. When the request is already near its memory ceiling, that
allocation itself exhausts memory and throws a *second* fatal, which masks the
real error: the log ends up pointing at `fatal-error-screen.php` (e.g. the CSS
`file_get_contents`) instead of whatever actually broke. The original error
need not be an OOM — any fatal on a request that's near the limit hits this.

So `wpcomsh_customize_fatal_error_message()` first calls
`wpcomsh_fatal_ensure_render_memory()`, which checks the free headroom
(`memory_limit` − `memory_get_usage()`) and, if it's short, raises the limit
enough to render. The decision is based on *available memory*, not the error
type. If the platform refuses the raise (some hosts cap `ini_set`), it returns
core's lighter default screen (PHP still logs the real fatal) rather than
re-fataling. A direct `ini_set` is used rather than `wp_raise_memory_limit()`,
which runs filters in the fatal path and no-ops when the limit is already high
(as on Atomic).

### Why helpers bootstrap WP manually

The fatal handler can fire before `wp-settings.php` finishes. At that point
cookie constants (`LOGGED_IN_COOKIE` etc.) aren't defined and
`pluggable.php` hasn't loaded, so `wp_validate_auth_cookie()` /
`current_user_can()` don't exist. The helpers call `wp_cookie_constants()`
and require the user/capability files on demand, wrapped in `try/catch`
because the fatal may itself be DB-related.

### Deactivation security model

The Deactivate button is a POST form whose hidden fields are HMAC-signed
(using `AUTH_SALT` and the current logged-in cookie) and expire after 5
minutes. Nonces aren't used because the endpoint runs before
`pluggable.php` is loaded. After verifying the signature the endpoint also
re-checks `current_user_can( 'deactivate_plugin', $plugin )` for the
target plugin.

### Load order

The deactivation endpoint must run **before** any plugin that might
fatal. On WordPress.com Atomic, wpcomsh is loaded by the platform's
top-level mu-plugin loader, so `wpcomsh.php` → `wpcom-fatal-error/load.php`
→ `fatal-plugin-deactivator.php` all run during the mu-plugin phase,
before the regular plugin loop. After validating the request the endpoint
updates `active_plugins` and redirects inline, exiting before the regular
plugin-include pass — so a *second* broken plugin can't fatal between
persistence and the redirect (which would otherwise leave the option
unchanged and the admin looping on the same fatal screen).

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
