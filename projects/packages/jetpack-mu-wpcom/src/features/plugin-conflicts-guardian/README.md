# Plugin Conflicts Guardian

Pre-flight plugin-activation check. When an admin clicks Activate (or finishes an Upload Plugin install), this feature loads the plugin in an isolated HTTP request and refuses the activation if that probe captures a fatal — the site stays up instead of entering recovery mode.

Ships dark: gated behind `apply_filters( 'pcg_guard_activation', false )`. Set the filter to `true` to enable both the activation and update guards.

## Files

| File | Role |
| --- | --- |
| `plugin-conflicts-guardian.php` | Bootstrap. Loads the rest only when `pcg_enable` is on. |
| `class-pcg-load-tester.php` | Client: fires the probe HTTP request and parses the verdict. |
| `probe-endpoint.php` | Server: handles `?pcg_probe=1`, requires the plugin, captures any fatal. |
| `activation-guard.php` | Hooks `load-plugins.php` / `load-update.php` and blocks failing activations. |
| `update-guard.php` | Hooks `upgrader_source_selection` to refuse installs/updates with PHP parse errors. |

## Activation flow

1. Admin submits an Activate request (`plugins.php?action=activate`, `…=activate-selected`, or `update.php?action=activate-plugin`).
2. `activation-guard.php` intercepts on `load-plugins.php` / `load-update.php` priority 0, verifies the nonce, and for each plugin calls `PCG_Load_Tester::test()`.
3. The load tester stashes the plugin path in a short-lived transient keyed by a random token, then `wp_remote_get`s `?pcg_probe=1&token=…` on this same site.
4. `probe-endpoint.php` runs synchronously at require time (already inside `plugins_loaded` priority 10 via `load_features()`), validates + consumes the token, defines `WP_SANDBOX_SCRAPING` so core's fatal handler steps aside, arms a shutdown handler, and `require`s the plugin's main file.
5. The probe lets WP finish bootstrapping (`init`, `admin_init`) so hook-time errors can fatal, then emits `{status: ok}` on `wp_loaded` at `PHP_INT_MAX`. A fatal or uncaught throwable becomes `{status: fatal|throwable, …}` with HTTP 200.
6. If any plugin failed, the guard stashes reasons in a per-user transient and redirects to `plugins.php?pcg_blocked=1`; the admin notice reads the transient and renders it.

## Why HTTP, not a CLI subprocess

Atomic and some managed hosts sandbox web-PHP so `proc_open` can't find/exec a CLI binary (`open_basedir` + restricted exec). A separate HTTP request is isolated from the admin request: if the plugin fatals, the probe 500s but the parent sees JSON via the shutdown handler, and the admin page keeps rendering.

## Limitations

- Only catches errors hit while `require`-ing the main file and during `plugins_loaded` / `init` / `admin_init` callbacks. Errors that surface only on later hooks (e.g. `template_redirect`, REST) are invisible.
- Other active plugins are live during the probe, so cross-plugin conflicts CAN surface (a full SHORTINIT sandbox would avoid that, but isn't portable here).

## Update flow (syntax-only)

`update-guard.php` hooks `upgrader_source_selection` after WP extracts the install/update zip and before it copies files over the live plugin. It tokenizes every `.php` in the source with `token_get_all(…, TOKEN_PARSE)` and returns a `WP_Error` listing any parse errors, which aborts the operation without touching the live files.

Why not the load probe: during an *update* the active version is already loaded in the probe request, so `require`-ing the new main file would always fatal with "Cannot redeclare class/function". Parse errors are the high-frequency release failure mode; runtime errors still trip on the next Activate click.
