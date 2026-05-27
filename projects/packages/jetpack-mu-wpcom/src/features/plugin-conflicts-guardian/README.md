# Plugin Conflicts Guardian

Pre-flight plugin-activation check. When an admin clicks Activate (or finishes an Upload Plugin install), this feature loads the plugin in an isolated HTTP request and refuses the activation if that probe captures a fatal — the site stays up instead of entering recovery mode.

Two independent filters:

- `pcg_guard_activation` — enables the activation probe and the syntax-only install/update gate. Defaults `true`.
- `pcg_guard_updates` — enables the post-update health check + rollback flow. Defaults `true`.

## Files

| File | Role |
| --- | --- |
| `plugin-conflicts-guardian.php` | Bootstrap. Wires the requires for the other files. |
| `class-pcg-load-tester.php` | Client: fires the probe HTTP request and parses the verdict. |
| `probe-endpoint.php` | Server: handles `?pcg_probe=1`, requires the plugin, captures any fatal. |
| `activation-guard.php` | Hooks `load-plugins.php` / `load-update.php` and blocks failing activations. |
| `update-guard.php` | Hooks `upgrader_source_selection` to refuse installs/updates with PHP parse errors. |
| `class-pcg-snapshot.php` | Transient-backed pre-update snapshot (version + was_active) plus an on-disk copy of the existing plugin files for offline rollback. |
| `class-pcg-rollback.php` | Restores from the local backup first; falls back to the WP.org versioned ZIP via `Plugin_Upgrader`. |
| `update-healthcheck.php` | Hooks `upgrader_pre_install` + `upgrader_process_complete`; probes, rolls back on fatal, renders an admin notice. |

## Activation flow

1. Admin submits an Activate request (`plugins.php?action=activate`, `…=activate-selected`, or `update.php?action=activate-plugin`).
2. `activation-guard.php` intercepts on `load-plugins.php` / `load-update.php` priority 0, verifies the nonce, filters the request down to eligible plugins (passes `validate_file`, not already active, file exists), and calls `PCG_Load_Tester::test()` once with the full batch.
3. The load tester stashes `{ plugins, mode }` in a short-lived transient keyed by a random token, then fires the probe against `?pcg_probe=1&token=…` on this same site. Activation flows pass `mode = activation`; the post-update health check passes `mode = update` (see "Post-update health check" below).
4. `probe-endpoint.php` runs synchronously at require time (already inside `plugins_loaded` priority 10 via `load_features()`), validates + consumes the token, gates on the per-mode filter (`pcg_guard_activation` for activation, `pcg_guard_updates` for update), defines `WP_SANDBOX_SCRAPING` so core's fatal handler steps aside, arms a shutdown handler, and in activation mode `require_once`s each plugin's main file in order under that single request. Probe cost is constant regardless of how many plugins are activated, and conflicts that only fire when two plugins load together (duplicate class, shared global) are caught — which a per-plugin probe model couldn't see. In update mode the files are already loaded by WP's normal bootstrap and re-requiring would fatal with "Cannot redeclare class/function" — the probe just verifies that bootstrap completed cleanly.
5. Two probes fire in parallel via `\WpOrg\Requests\Requests::request_multiple()`: one against `home_url('/')` (front-end) and one against `admin_url('index.php')` with `pcg_admin=1` and the admin's WP auth cookies forwarded so `auth_redirect()` clears. Requests follows up to 5 redirects (matching `wp_remote_get`'s default), so canonical http→https / trailing-slash / non-www→www on the front-end and `force_ssl_admin`'s http→https bounce on the admin probe both reach a real verdict (WP emits full-URL `Location:` headers from `home_url`/`set_url_scheme` so `pcg_probe`/`token` survives, and Requests re-sends the forwarded `Cookie:` header on the followed request so admin auth still validates after the scheme bounce). The admin probe defers its verdict to `admin_init` priority `PHP_INT_MAX`; the front-end probe emits on `wp_loaded`. A captured `fatal` / `throwable` from either probe wins; otherwise the front-end verdict is returned. Inconclusive verdicts (exceeded redirect budget, destination dropped the probe query, or unfollowed 3xx) become `ok-inconclusive` — a non-blocking pass since the bootstrap was healthy enough to redirect or render — so they're distinguishable from a clean `ok` in logs without breaking activation.
   - The probe endpoint sends an `X-PCG-Probe: 1` header the moment it recognizes a probe request. A `200` response *without* that header means the loopback never reached the endpoint — a full-page/edge cache, a security plugin, or a maintenance page answered it — so the verdict is a non-blocking `error`. A `200` that *did* carry the marker but no JSON verdict is also non-blocking (`ok-inconclusive`) — under the "only block on a captured fatal" policy, the absence of a verdict isn't itself a verdict. The same applies to an HTTP `500` without a JSON body: it could be an upstream LB, edge proxy, intercepting plugin, or engine death we can't attribute to any one plugin. Both classes are recorded via the `Probe anomaly allowed` logstash event so we can measure the rate.
   - The probe shutdown handler always emits a JSON verdict (never returns silently). On a captured engine fatal it emits `status=fatal`; otherwise it emits `status=ok-shutdown` — non-blocking, logged via `Probe anomaly allowed`. `ok-shutdown` covers the clean-`exit`/`die`-during-init case: a plugin terminated the request without a fatal in `error_get_last()`, which used to surface as "marker present, no JSON" and got misclassified as a fatal. A re-entry guard inside the handler keeps `wp_send_json → exit → shutdown phase` from emitting twice.
6. On a fatal/throwable the guard attributes the failure to one plugin in the batch — preferring the explicit `plugin` field (set when a `Throwable` is caught around the `require`), then falling back to matching the captured `file` against each plugin's directory. The whole batch is blocked as a unit; the notice tells the admin which plugin caused the fatal so they can retry without it.

```
 Admin click Activate
         │
         ▼
 activation-guard.php ──► verify nonce + capability
         │
         ▼
 PCG_Load_Tester::test( [paths…] )
         │
         │ stash { plugins, mode } in transient (random token)
         ▼
 GET /?pcg_probe=1&token=…  ◄── HTTP self-request
         │
         ▼
 probe-endpoint.php
   validate + consume token
   gate on per-mode filter
     (pcg_guard_activation | pcg_guard_updates)
   define WP_SANDBOX_SCRAPING
   register shutdown handler
   foreach $plugin_main: require_once  (activation mode only — update
                                         mode skips this; plugins already
                                         loaded by WP's bootstrap)
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

## Update flow (syntax-only, pre-install)

`update-guard.php` hooks `upgrader_source_selection` after WP extracts the install/update zip and before it copies files over the live plugin. It tokenizes every `.php` in the source with `token_get_all(…, TOKEN_PARSE)`. If any file fails to parse, it returns a `WP_Error` whose message names the first parse error and whose `$data['errors']` array carries the full list, aborting the operation without touching the live files.

The scan has an 8-second wall-clock budget (`PCG_UPDATE_GUARD_BUDGET_SECONDS`). Big packages (WooCommerce, Yoast, etc.) can have thousands of PHP files and we'd rather not blow the cron / request timeout. On bail with no errors found we don't fail-closed — we let the install/update through and `error_log` the slug + action so we can see how often this fires and on which packages.

Loaded unconditionally (not gated on `is_admin()`) so cron auto-updates also hit the gate.

Why not the load probe at this stage: during an *update* the active version is already loaded in the probe request, so `require`-ing the new main file would always fatal with "Cannot redeclare class/function". Parse errors are the high-frequency release failure mode.

## Post-update health check + rollback

Gated on `pcg_guard_updates`. Runs *after* files are swapped, in a fresh HTTP request. Because the post-update target is already an active plugin, the probe runs in `update` mode (no re-`require`), which sidesteps the "Cannot redeclare" problem that the pre-install syntax-only gate avoids by not loading at all.

1. `upgrader_pre_install` — `PCG_Snapshot::capture()` reads the current plugin's `Version` and `is_plugin_active()`, stashes them in a transient keyed by the plugin basename, **and copies the live plugin files to `<get_temp_dir()>/pcg-backups/<unique>/<asset>`** (override via the `pcg_backup_root` filter) so we can restore offline without re-downloading.
2. Core extracts + copies the new files (the original copy is still safely tucked away under `pcg-backups/`).
3. `upgrader_process_complete` (priority 99) — `update-healthcheck.php` drains the snapshots for every plugin in `hook_extra['plugins']`, keeps the ones that were active and whose new files are still on disk, and runs **one** `PCG_Load_Tester::test( $plugin_mains, PCG_Load_Tester::MODE_UPDATE )` for the whole batch. MODE_UPDATE checks whether the site as a whole bootstraps; it doesn't isolate a specific plugin, so a single probe is enough. The probe endpoint skips the `require_once` in update mode and just observes whether the (already-loaded) new code completes the bootstrap cleanly.
4. On `ok` (or any inconclusive non-fatal status), every backup in the batch is deleted and we're done.
5. On `fatal` / `throwable`, `PCG_Rollback::to_snapshot()` runs for **every** snapshot in the batch — deactivating each broken plugin, **swapping the new files for the saved local backup** via rename (or copy + delete-source as a fallback for cross-fs cases), and reactivating if the plugin was active. We can't tell which plugin in the batch caused the fatal, so restoring the whole batch is the safe call.
6. If a local backup is missing or the swap fails, `PCG_Rollback` falls back to fetching `https://downloads.wordpress.org/plugin/{slug}.{old_version}.zip` and reinstalling via `Plugin_Upgrader`. This still helps for .org plugins on hosts where the local backup couldn't be created (full disk, restrictive perms).
7. If neither path works, the plugin is left deactivated and the admin notice says so.
8. Notices are stashed in a site-wide transient and drained by `admin_notices` for users with `manage_options` (so cron / WP-CLI updates, which run with no current user, still surface to admins on next page load).

```
 upgrader_pre_install
         │
         ▼
 PCG_Snapshot::capture()  ──► transient { version, was_active }
         │
         ▼
 [core copies new files]
         │
         ▼
 upgrader_process_complete (priority 99)
         │
         ├── any candidates active + on disk? ── no ──► done
         │
         ▼ yes
 PCG_Load_Tester::test()  (one HTTP probe for the batch)
         │
         ├── ok ──────────────────────────────────────► done
         │
         ▼ fatal / throwable
 for each snapshot in batch:
   PCG_Rollback::to_snapshot()
     deactivate broken
     swap new files for local backup
     (or GET downloads.wordpress.org/plugin/{slug}.{old_ver}.zip + Plugin_Upgrader::install)
     reactivate (if was_active)
         │
         ▼
 stash admin notice + fire pcg_post_update_diagnosis action
```

### Limitations (v1)

- Only probes `home_url()`. Fatals that only surface on admin / REST aren't caught yet.
- Rollback works for any plugin via the local backup; the WP.org versioned ZIP is only used as a fallback when the local backup is missing.
- No debug.log classifier yet — probe verdict is the only signal.
- Multisite network updates are out of scope; the probe runs against the current site's `home_url()`.
