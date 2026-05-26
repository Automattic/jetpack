# Plugin Conflicts Guardian

Pre-flight plugin-activation check. When an admin clicks Activate (or finishes an Upload Plugin install), this feature loads the plugin in an isolated HTTP request and refuses the activation if that probe captures a fatal — the site stays up instead of entering recovery mode.

Two independent filters:

- `pcg_guard_activation` — enables the activation probe and the syntax-only install/update gate. Defaults `true`.
- `pcg_guard_updates` — enables the post-update health check + rollback flow. Defaults `true`.

## Files

| File | Role |
| --- | --- |
| `plugin-conflicts-guardian.php` | Bootstrap. Wires the requires for the other files. |
| `class-pcg-load-tester.php` | Client: fires the probe HTTP request, parses the verdict, applies sibling-load downgrade + signature allowlist. |
| `class-pcg-rollout.php` | Percentage-based rollout gate that narrows `pcg_guard_activation` / `pcg_guard_updates` per blog. |
| `probe-endpoint.php` | Server: handles `?pcg_probe=1`, defers `require_once` to `wp_loaded`, captures any fatal. |
| `activation-guard.php` | Hooks `load-plugins.php` / `load-update.php` and blocks failing activations. |
| `update-guard.php` | Hooks `upgrader_source_selection` to refuse installs/updates with PHP parse errors. |
| `class-pcg-snapshot.php` | Transient-backed pre-update snapshot (version + was_active) plus an on-disk copy of the existing plugin files for offline rollback. |
| `class-pcg-rollback.php` | Restores from the local backup first; falls back to the WP.org versioned ZIP via `Plugin_Upgrader`. |
| `update-healthcheck.php` | Hooks `upgrader_pre_install` + `upgrader_process_complete`; probes, rolls back on fatal, renders an admin notice. |

## Activation flow

1. Admin submits an Activate request (`plugins.php?action=activate`, `…=activate-selected`, or `update.php?action=activate-plugin`).
2. `activation-guard.php` intercepts on `load-plugins.php` / `load-update.php` priority 0, verifies the nonce, filters the request down to eligible plugins (passes `validate_file`, not already active, file exists), and calls `PCG_Load_Tester::test()` once with the full batch.
3. The load tester stashes `{ plugins, mode }` in a short-lived transient keyed by a random token, then fires the probe against `?pcg_probe=1&token=…` on this same site. Activation flows pass `mode = activation`; the post-update health check passes `mode = update` (see "Post-update health check" below).
4. `probe-endpoint.php` runs synchronously at require time (already inside `plugins_loaded` priority 10 via `load_features()`), validates + consumes the token, gates on the per-mode filter (`pcg_guard_activation` for activation, `pcg_guard_updates` for update — both narrowed by `PCG_Rollout`'s percentage gate), defines `WP_SANDBOX_SCRAPING` so core's fatal handler steps aside, and arms a shutdown handler. In **activation mode** the `require_once` of each candidate is deferred to `wp_loaded:1`, so dependency shims registered later in the bootstrap (Action Scheduler's `as_*` functions, WC constants like `WC_ADMIN_ABSPATH`, plugin singletons set up during `init`) are available when we exercise the candidate's load path. Probe cost is constant regardless of how many plugins are activated, and conflicts that only fire when two plugins load together (duplicate class, shared global) are caught — which a per-plugin probe model couldn't see. In **update mode** the files are already loaded by WP's normal bootstrap and re-requiring would fatal with "Cannot redeclare class/function" — the probe just verifies that bootstrap completed cleanly.
5. Two probes fire in parallel via `\WpOrg\Requests\Requests::request_multiple()`: one against `home_url('/')` (front-end) and one against `admin_url('index.php')` with `pcg_admin=1` and the admin's WP auth cookies forwarded so `auth_redirect()` clears. Requests follows up to 5 redirects (matching `wp_remote_get`'s default), so canonical http→https / trailing-slash / non-www→www on the front-end and `force_ssl_admin`'s http→https bounce on the admin probe both reach a real verdict (WP emits full-URL `Location:` headers from `home_url`/`set_url_scheme` so `pcg_probe`/`token` survives, and Requests re-sends the forwarded `Cookie:` header on the followed request so admin auth still validates after the scheme bounce). The admin probe defers its verdict to `admin_init` priority `PHP_INT_MAX`; the front-end probe emits on `wp_loaded`. A captured `fatal` / `throwable` from either probe wins; otherwise the front-end verdict is returned. Inconclusive verdicts (exceeded redirect budget, destination dropped the probe query, unfollowed 3xx, HTTP 500 without a captured fatal, intercepted loopback, marker present but no JSON body) become `ok-inconclusive` — a non-blocking pass — so the user can always proceed and we still get a logstash record of the suspicious signal.
   - The probe endpoint sends an `X-PCG-Probe: 1` header the moment it recognizes a probe request. A `200` response *without* that header means the loopback never reached the endpoint (full-page/edge cache, security plugin, maintenance page); a `200` *with* the marker but no JSON verdict means the endpoint ran but the bootstrap died before either `pcg_probe_emit_ok` or `pcg_probe_shutdown` could write a verdict (genuine engine death — segfault, OOM kill, FastCGI termination — or a mid-stream connection drop). Both are inconclusive: PCG only blocks on a fatal it actually captured, never on one it inferred from a missing response.
6. On a fatal/throwable the guard attributes the failure to one plugin in the batch — preferring the explicit `plugin` field (set when a `Throwable` is caught around the `require`), then falling back to matching the captured `file` against each plugin's directory. The whole batch is blocked as a unit; the notice tells the admin which plugin caused the fatal so they can retry without it.

### Block policy: only on captured fatal

PCG never blocks on a *guessed* fatal. The paths that emit `status: fatal` / `status: throwable` are:

- The shutdown handler in `probe-endpoint.php`, which uses `PCG_Load_Tester::classify_shutdown( error_get_last() )` to convert an engine-fatal errno into a `fatal` verdict. Anything outside `SHUTDOWN_FATAL_MASK` becomes `ok-shutdown`.
- The `require_once` catch block in MODE_ACTIVATION, which converts a thrown `\Throwable` into a `throwable` verdict with `plugin`/`class`/`file`/`line`.
- The shutdown handler also re-attributes via the **require-time milestone** (see below): a missing wp_loaded/admin_init verdict during a candidate's load becomes a `throwable` against that candidate; a missing verdict *before* the candidate's require even ran becomes an `error` (inconclusive).

The shutdown handler is registered with `register_shutdown_function`, which means it fires after every `exit` — including the `exit` at the end of `pcg_probe_respond` itself. A re-entry guard (`pcg_probe_already_emitted`) ensures the second invocation short-circuits, so the response body always contains exactly one JSON document. Without the guard the always-emit semantics would double-emit on every successful probe, breaking the client's `json_decode` and routing the marker+200 fall-through to a false-positive fatal.

### Require-time milestone tracking

In MODE_ACTIVATION the candidate's `require_once` runs from a deferred `wp_loaded:1` closure (see flow step 4). `probe-endpoint.php` tracks a per-request milestone — `pre-require` → `in-require:$plugin` → `required` — so the shutdown handler can distinguish three failure modes that would otherwise all look like a missing verdict:

| Milestone at shutdown | Verdict | Why |
| --- | --- | --- |
| `required` (or update mode) | `classify_shutdown` as today (`fatal` / `ok-shutdown`) | Normal post-require shutdown. |
| `in-require:$plugin` and no engine fatal | `throwable` attributing to `$plugin` | The candidate called `exit` / `die` / `wp_die` from its main file. A real WP activation would abort the same way — block, don't silently allow. |
| `pre-require` (deferred closure never ran) | `error` | An earlier plugin exited during `init` before our `wp_loaded` callback fired; the probe learned nothing about the candidate, so the verdict is inconclusive (allow + log). |

### Sibling-load flake downgrade

A captured fatal where the candidate plugin's entry file loads but a sibling under its own directory fails to require or autoload is downgraded to `ok-inconclusive` (allow + log). `PCG_Load_Tester::is_sibling_load_flake()` recognises the signature — `Failed opening required` / `failed to open stream` / canonical `Class "Name" not found` whose captured `file` lies inside one of the candidate plugins' own directories. For the `throwable` arm, the captured `class` must be a PHP **engine** error class (`\Error`, `\TypeError`, `\ParseError`, etc.) — a plugin hand-throwing a `\RuntimeException` with class-not-found-shaped wording is asking to abort and is *not* downgraded.

The downgrade fires on the first match; logstash on the production data shows the same `(blog, file)` combinations reproducing for hours when this happens, so a retry can't convert deterministic failures into successes — CLI activation (or a second admin-page activation attempt) remains the recovery path. The mechanism behind these flakes isn't yet identified; downgrading on the stable signature is defensible regardless of cause.

**Scope:** this downgrade only runs in `MODE_ACTIVATION`. In `MODE_UPDATE` the new plugin files are already swapped into place; allowing a captured fatal would leave the broken update active and `PCG_Rollback::to_snapshot()` would never fire. Update-mode captured fatals always block.

### Per-signature allowlist

Some captured fatals only fire in the probe context because the probe isn't a perfect replica of a real activation (no request-scoped data, anonymous loopback, etc.). The `pcg_signature_allowlist` filter lets specific signatures be allowlisted so the verdict is downgraded to `ok-inconclusive`:

```php
add_filter( 'pcg_signature_allowlist', function ( $list ) {
    // GF 2.10.1+ — null array_walk during block init in probe context.
    // Sunset when GF ships the fix (tracking: WCCOM-2563).
    $list[] = array(
        'label'   => 'gf-2.10.1-array-walk-null',
        'plugin'  => 'gravityforms/gravityforms.php',
        'message' => '/array_walk\(\).+null given/',
    );
    return $list;
} );
```

Each entry should carry a code comment + sunset date so it can be deleted once the upstream fix ships. Matching is on basename for `plugin` / `file` and PCRE for `message`. Entries with none of the three narrowing keys are rejected and logged as `Signature allowlist rejected` so operators can see when their allowlist is partially inert. A plugin-scoped entry requires the verdict to carry an explicit `plugin` attribution (i.e. the throwable-arm `plugin` field set when a `\Throwable` is caught around the require); a shutdown-handler `fatal` verdict has no `plugin` key, so plugin-scoped entries never match it — only the `file` and `message` arms apply.

Like the sibling-load downgrade, signature-allowlist downgrades only run in `MODE_ACTIVATION`. Matches are sampled to logstash under `Signature allowlist match`.

### Percentage rollout

`PCG_Rollout` narrows `pcg_guard_activation` / `pcg_guard_updates` per blog. Default is **0%** — PCG is off everywhere until the operator opts in:

```php
add_filter( 'pcg_rollout_percentage', fn () => 10 ); // 10% cohort
add_filter( 'pcg_rollout_force_enable_blogs', fn () => array( 12345 ) ); // explicit opt-in
```

Bucketing is `crc32(blog_id) % 100`, so ramping from 10% → 50% strictly adds blogs (no reshuffling between tiers). Force-enabling overrides the percentage gate so test blogs can opt in regardless of bucket. The gate only narrows — emergency-override filters at priority > 100 can still re-enable or disable a blog.

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

- Only catches errors hit while `require`-ing the main file and during `init` / `admin_init` / `wp_loaded` callbacks. Errors that surface only on later hooks (e.g. `template_redirect`, REST) are invisible.
- The candidate's `require_once` runs at `wp_loaded:1`, so the candidate's own `plugins_loaded` callbacks are not invoked in the probe context. A real activation click doesn't fire those callbacks either (they fire on the *next* request), so the probe still matches the real activation shape — but a plugin whose `plugins_loaded` callback is the only thing that fatals on its next page-load would slip through.
- The probe environment isn't a perfect replica of a real activation: the candidate plugin is `require`d under a probe loopback rather than reached via the normal activation path. A plugin whose bootstrap reads request- or post-scoped data that's null in the isolated probe context (e.g. Gravity Forms 2.10.1 calling `array_walk()` on null during block init) will fatal at probe time without fataling on a real activation. Handled by entries on the `pcg_signature_allowlist` filter, see above.
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
4. On any non-fatal verdict (`ok`, `ok-shutdown`, `ok-inconclusive`, `error`), every backup in the batch is deleted and we're done. Captured-fatal downgrades don't reach update mode (MODE_UPDATE never downgrades), so a non-fatal verdict here genuinely means there's nothing to roll back. Preserving the backup beyond this point would orphan it anyway — the snapshot transient has already been `consume()`d to build the candidate list.
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
