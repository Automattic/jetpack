# Plugin Conflicts Guardian

Pre-flight plugin-activation check. When an admin clicks Activate (or finishes an Upload Plugin install), this feature loads the plugin in an isolated HTTP request and refuses the activation if that probe captures a fatal — the site stays up instead of entering recovery mode.

Ships dark: gated behind `apply_filters( 'pcg_guard_activation', false )`. Set the filter to `true` to enable both the activation and update guards.

## Files

| File | Role |
| --- | --- |
| `plugin-conflicts-guardian.php` | Bootstrap. Wires the requires for the other files. |
| `class-pcg-load-tester.php` | Client: fires the probe HTTP request and parses the verdict. |
| `probe-endpoint.php` | Server: handles `?pcg_probe=1`, requires the plugin, captures any fatal. |
| `activation-guard.php` | Hooks `load-plugins.php` / `load-update.php` and blocks failing activations. |
| `update-guard.php` | Hooks `upgrader_source_selection` to refuse installs/updates with PHP parse errors. |

## Activation flow

1. Admin submits an Activate request (`plugins.php?action=activate`, `…=activate-selected`, or `update.php?action=activate-plugin`).
2. `activation-guard.php` intercepts on `load-plugins.php` / `load-update.php` priority 0, verifies the nonce, and for each plugin calls `PCG_Load_Tester::test()`.
3. The load tester stashes the plugin path in a short-lived transient keyed by a random token, then `wp_remote_get`s `?pcg_probe=1&token=…` on this same site.
4. `probe-endpoint.php` runs synchronously at require time (already inside `plugins_loaded` priority 10 via `load_features()`), validates + consumes the token, defines `WP_SANDBOX_SCRAPING` so core's fatal handler steps aside, arms a shutdown handler, and `require`s the plugin's main file.
5. Two probes fire in parallel via `\WpOrg\Requests\Requests::request_multiple()`: one against `home_url('/')` (front-end) and one against `admin_url('index.php')` with `pcg_admin=1` and the admin's WP auth cookies forwarded so `auth_redirect()` clears. The admin probe defers its verdict to `admin_init` priority `PHP_INT_MAX`; the front-end probe emits on `wp_loaded`. A captured `fatal` / `throwable` from either probe wins; otherwise the front-end verdict is returned. A 302 on the admin probe (cookies missing/expired) becomes a distinct `ok-inconclusive` status that's still treated as a non-blocking pass — that way transport quirks don't break activation, but the signal can be measured separately from a clean `ok`.
6. If any plugin failed, the guard stashes reasons in a per-user transient and redirects to `plugins.php?pcg_blocked=1`; the admin notice reads the transient and renders it.

```
 Admin click Activate
         │
         ▼
 activation-guard.php ──► verify nonce + capability
         │
         ▼
 PCG_Load_Tester::test()
         │
         │ stash {path} in transient (random token)
         ▼
 GET /?pcg_probe=1&token=…  ◄── HTTP self-request
         │
         ▼
 probe-endpoint.php
   validate + consume token
   define WP_SANDBOX_SCRAPING
   register shutdown handler
   require $plugin_main
         │
         ├───► fatal / throwable ──► {status: fatal|throwable} (HTTP 200)
         │                                  │
         │                                  ▼
         │                          Guard stashes reason,
         │                          302 → plugins.php?pcg_blocked=1
         │
         └───► clean load
                 │
                 ▼
          wait for init / admin_init / wp_loaded
                 │
                 ▼
          {status: ok} (HTTP 200)
                 │
                 ▼
          Guard hands off to core activate_plugin()
```

## Why HTTP, not a CLI subprocess

Atomic and some managed hosts sandbox web-PHP so `proc_open` can't find/exec a CLI binary (`open_basedir` + restricted exec). A separate HTTP request is isolated from the admin request: if the plugin fatals, the probe 500s but the parent sees JSON via the shutdown handler, and the admin page keeps rendering.

## Limitations

- Only catches errors hit while `require`-ing the main file and during `plugins_loaded` / `init` / `admin_init` callbacks. Errors that surface only on later hooks (e.g. `template_redirect`, REST) are invisible.
- The probe endpoint is wired up via jetpack-mu-wpcom's `load_features()` at `plugins_loaded` priority 10, so plugin callbacks registered for `plugins_loaded` at priority < 10 will have already fired before the plugin under test is `require`d. Fatals from those earlier-priority callbacks are missed. Hooking the probe handler earlier would require splitting it out of `load_features()`.
- Other active plugins are live during the probe, so cross-plugin conflicts CAN surface (a full SHORTINIT sandbox would avoid that, but isn't portable here).

## Update flow (syntax-only)

`update-guard.php` hooks `upgrader_source_selection` after WP extracts the install/update zip and before it copies files over the live plugin. It tokenizes every `.php` in the source with `token_get_all(…, TOKEN_PARSE)`. If any file fails to parse, it returns a `WP_Error` whose message names the first parse error and whose `$data['errors']` array carries the full list, aborting the operation without touching the live files.

The scan has an 8-second wall-clock budget (`PCG_UPDATE_GUARD_BUDGET_SECONDS`). Big packages (WooCommerce, Yoast, etc.) can have thousands of PHP files and we'd rather not blow the cron / request timeout. On bail with no errors found we don't fail-closed — we let the install/update through and `error_log` the slug + action so we can see how often this fires and on which packages.

Loaded unconditionally (not gated on `is_admin()`) so cron auto-updates also hit the gate.

Why not the load probe at this stage: during an *update* the active version is already loaded in the probe request, so `require`-ing the new main file would always fatal with "Cannot redeclare class/function". Parse errors are the high-frequency release failure mode; runtime errors still trip on the next Activate click.
