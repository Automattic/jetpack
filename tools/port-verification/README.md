# Port verification check (JETPACK-2685)

Scripts steps 2 and 3 of the wp-build port verification rule defined in
[JETPACK-2573](https://linear.app/a8c/issue/JETPACK-2573): computed styles/geometry, and the
network panel, compared with the port's feature flag off versus on. Steps 1, 4, 5, 6 and 7 of
that rule stay manual -- see "Not covered" below.

## What it checks

- **Step 2, geometry.** `#wpwrap` (page root), `#wpbody-content`, `#wpadminbar` (header),
  `#wpfooter`, plus `font-family` and one control's full box model (margin/border/padding,
  `box-sizing`, `font-size`). These are core wp-admin markup present whether the flag is off
  or on, so a diff catches the port shifting the frame around its content -- the failure mode
  JETPACK-2573 calls out: "a 4px shift is invisible in a screenshot and obvious in a number."
  A target that goes invisible (e.g. `#wpfooter`, which boot hides by design -- see
  `projects/js-packages/base-styles/admin-page-layout.scss`) is reported as a visibility
  change, not a bogus zero-rect geometry shift; the check walks ancestors, so a wrapper that
  goes `display: none` counts too. Rects are stored unrounded, so `--tolerance` means
  something below 1px. A control selector that matches more than one element is reported,
  since each side then compares its own first match.
- **Step 3, network.** Every request the page fires, matched flag-off to flag-on by method +
  path (nonces and cache-busting query params -- see `DEFAULT_IGNORED_QUERY_PARAMS` in
  `src/selectors.js` -- are stripped before matching and before display, so the report never
  quotes a live nonce). Reports requests that fired on one side only, requests whose set of
  status codes changed, and requests that fired a different number of times. This is what
  caught a `design-tokens.css` 404 and a renamed JITM message path in the My Jetpack pilot --
  both zero-pixel changes. Requests that never get a response -- a bad host, a refused
  connection, a CSP block -- are recorded too, with status `0`. The login and Dashboard page
  loads are dropped before the diff, so only the page you pointed it at is compared, and the
  report states how many requests each side contributed so an empty capture cannot read as
  agreement.

The one difference JETPACK-2573 accepts is a uniform 8px inset from boot's stage gutter on the
page root. The report says so in its footer; it does not try to auto-approve that one row.

## Setup

```
cd tools/port-verification
pnpm install
pnpm setup:browsers
```

## Usage

One command, run against a live site (a Jurassic Ninja site is the normal target):

```
node bin/verify-port.js run \
  --url https://<site>.jurassic.ninja/wp-admin/admin.php?page=<page> \
  --flag <feature_flag_name> \
  --user admin --pass <password> \
  --control-selector '.jetpack-backup__primary-action' \
  > port-verification-report.md
```

The report goes to stdout; progress and the flag prompt go to stderr, so redirecting stdout
keeps the prompt visible. `run` needs an interactive terminal and asks you to type the flag
name, not just press Enter -- a stray keypress buffered during the first capture would
otherwise answer the prompt and leave both captures on the same side of the flag.

It captures the page with the flag off, then pauses:

```
Flip <feature_flag_name> ON on the site now, then press Enter to continue...
```

Flip it with whatever the port uses to force the flag on that site -- `wp jetpack feature-flag
<name> on` over SSH, or the `jetpack-feature-flag` skill's JN helper -- then press Enter. The
script captures again with the flag on, diffs both captures, and prints a Markdown report to
paste straight into the PR (also written to `--out <file>` if given, or redirect stdout as
above).

### Options

| Flag                   | Meaning                                                                                                                                                                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url`                | Page to capture. Required.                                                                                                                                                                                                                                                                                                                  |
| `--flag`               | Feature flag name, printed in the pause prompt and the report header. Optional.                                                                                                                                                                                                                                                             |
| `--user` / `--pass`    | wp-admin login. Falls back to `WP_ADMIN_USER` / `WP_ADMIN_PASS`. Each capture starts a fresh browser profile with no cookies, so omit these only when the URL authenticates by itself -- a Jurassic Ninja autologin link. Otherwise the capture aborts on landing at `wp-login.php`.                                                        |
| `--control-selector`   | CSS selector for the one control to box-model (step 2). Omit it and the report says the control was skipped.                                                                                                                                                                                                                                |
| `--wait-selector`      | Selector that must be visible after navigation, e.g. the boot mount. In `run` it applies to the flag-on capture only, and the flag-off capture asserts the same selector is _absent_ -- which is what proves the flag actually flipped.                                                                                                     |
| `--tolerance`          | Geometry tolerance in px. Default `0.5` -- rounding noise, not a real shift. A non-numeric value is rejected rather than silently disabling step 2.                                                                                                                                                                                         |
| `--ignore-query-param` | Repeatable. Adds a query param to the default ignore list for step 3 matching and display (`_wpnonce`, `_ajax_nonce`, `_nonce`, `ver`, `_`, `_locale`). Use it for a site-specific volatile param -- generic names like `v` or `t` are deliberately not ignored by default, since they can carry real state (an API version, a tab filter). |
| `--autologin-url`      | Visited before the target, for a host whose link logs you in (Jurassic Ninja's `?auto_login`). Use instead of `--user`/`--pass`.                                                                                                                                                                                                            |
| `--load-state`         | `load`, `domcontentloaded` or `networkidle` (default). Drop to `load` for a page with a request that never settles, as `tools/performance` had to for the Forms dashboard.                                                                                                                                                                  |
| `--ignore-host`        | Repeatable. Adds a host to the ignored list (`pixel.wp.com`). Traffic from these is dropped before the diff, because a per-event URL produces a new key on every load.                                                                                                                                                                      |
| `--out`                | Write the report to a file (in addition to stdout).                                                                                                                                                                                                                                                                                         |
| `--headed`             | Run the browser headed, for watching the capture happen.                                                                                                                                                                                                                                                                                    |

### Two-step alternative

If pausing mid-command inside one process is awkward (e.g. flipping the flag needs a separate
terminal), capture and diff separately:

```
node bin/verify-port.js capture --url <url> --user admin --pass <password> --out off.snapshot.json
# flip the flag
node bin/verify-port.js capture --url <url> --user admin --pass <password> --out on.snapshot.json
node bin/verify-port.js diff --before off.snapshot.json --after on.snapshot.json \
  --out port-verification-report.md
```

Keep the `.snapshot.json` suffix: `.gitignore` matches it, and a snapshot stores raw request
URLs, nonces included. Only the report is redacted.

## Sample output

```
## Port verification -- steps 2 & 3 (JETPACK-2685)

**Page:** `https://example.jurassic.ninja/wp-admin/admin.php?page=jetpack-forms-responses`
**Flag:** `rsm_jetpack_ui_modernization_forms`
**Before (flag off):** captured 2026-09-21T12:00:00.000Z
**After (flag on):** captured 2026-09-21T12:03:00.000Z

### Step 2 -- computed styles and geometry

| Element | Status | Details |
| --- | --- | --- |
| Page root (#wpwrap) | CHANGED | x: 0px -> 8px (Δ8.0px)<br>y: 0px -> 8px (Δ8.0px)<br>width: 1280px -> 1264px (Δ16.0px)<br>height: 900px -> 884px (Δ16.0px) |
| #wpbody-content | OK | — |
| Header (#wpadminbar) | OK | — |
| Footer (#wpfooter) | OK (hidden by design) | visibility: visible -> hidden |
| Control | OK | — |

### Step 3 -- network panel

Compared 14 request(s) with the flag off against 15 with it on.

- Only with flag off (0):
  - none
- Only with flag on (1):
  - `GET https://example.jurassic.ninja/wp-content/plugins/jetpack/design-tokens.css` -> 404
- Status code changed (0):
  - none
- Request count changed (0):
  - none

### Summary

1 geometry finding(s), 1 network finding(s).
The only difference JETPACK-2573 accepts is a uniform 8px inset from boot's stage gutter on the
page root. Anything else above needs a look before merging.
```

## Not covered

Steps 1 (flag off matches trunk), 4 (deep links in a fresh tab), 5 (RTL), 6 (non-default admin
colour scheme) and 7 (delete `build/` and reload) stay manual -- they need a human looking at
the page, not a diff.

Steps 5 and 6 are the ones most worth automating next: both known post-ship regressions on
already-ported dashboards ([#51963](https://github.com/Automattic/jetpack/pull/51963),
[#51619](https://github.com/Automattic/jetpack/pull/51619)) were in RTL and colour-scheme,
which steps 2 and 3 do not cover as written. The geometry side extends cheaply: capture the
same targets with the page in `dir="rtl"` (content column must not clip under the admin menu)
and with a non-default admin colour scheme active (the backdrop must follow the menu colour,
per `class-wp-build-admin-frame.php`), and diff against the LTR / default-scheme capture instead
of against flag-off. The network side has nothing to add for either -- same requests either way
-- so steps 5 and 6 would each need their own geometry-only assertions in `diff.js`, not a new
network check.

## Testing

```
pnpm test        # src/*.test.js -- diff, report and option parsing, no browser
pnpm test:smoke  # test/*.test.js -- capture.js against a local wp-admin stub
```

`pnpm test` runs in CI through the root `composer.json` `test-js` script. `pnpm test:smoke`
drives a real headless Chromium against `test/stub-wp-admin.js`, a ~100-line `node:http`
server that serves wp-login.php, a Dashboard and one admin page whose markup changes with a
query flag. It covers login, the post-login buffer clear, the redirect guards, ancestor-aware
hidden detection and the failed-request path. It skips itself when no Chromium is installed,
so it stays out of `pnpm test`.

What neither covers: the default selectors against a real wp-admin page. Verify that by hand
against a Jurassic Ninja site.
