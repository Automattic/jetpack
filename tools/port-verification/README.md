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
  A target that goes `display: none` (e.g. `#wpfooter`, which boot hides by design -- see
  `projects/js-packages/base-styles/admin-page-layout.scss`) is reported as a visibility
  change, not a bogus zero-rect geometry shift.
- **Step 3, network.** Every request the page fires, matched flag-off to flag-on by method +
  path (nonces and cache-busting query params -- see `DEFAULT_IGNORED_QUERY_PARAMS` in
  `src/selectors.js` -- are stripped before matching and before display, so the report never
  quotes a live nonce). Reports requests that only fired one time, and requests whose status
  code changed. This is what caught a `design-tokens.css` 404 and a renamed JITM message path
  in the My Jetpack pilot -- both zero-pixel changes.

The one difference JETPACK-2573 accepts is a uniform 8px inset from boot's stage gutter on the
page root. The report says so in its footer; it does not try to auto-approve that one row.

## Setup

```
cd tools/port-verification
pnpm install
pnpm exec playwright install chromium
```

## Usage

One command, run against a live site (a Jurassic Ninja site is the normal target):

```
node bin/verify-port.js run \
  --url https://<site>.jurassic.ninja/wp-admin/admin.php?page=<page> \
  --flag <feature_flag_name> \
  --user admin --pass <password> \
  --control-selector '.components-button' \
  > port-verification-report.md
```

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

| Flag                   | Meaning                                                                                                                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--url`                | Page to capture. Required.                                                                                                                                                                                                                                                                                         |
| `--flag`               | Feature flag name, printed in the pause prompt and the report header. Optional.                                                                                                                                                                                                                                    |
| `--user` / `--pass`    | wp-admin login. Falls back to `WP_ADMIN_USER` / `WP_ADMIN_PASS`. Omit to capture without logging in (e.g. the site is already authenticated).                                                                                                                                                                      |
| `--control-selector`   | CSS selector for the one control to box-model (step 2). Skipped if omitted.                                                                                                                                                                                                                                        |
| `--wait-selector`      | Extra selector to wait for after navigation, e.g. the boot mount, so a slow-hydrating page isn't captured mid-render.                                                                                                                                                                                              |
| `--tolerance`          | Geometry tolerance in px. Default `0.5` -- rounding noise, not a real shift.                                                                                                                                                                                                                                       |
| `--ignore-query-param` | Repeatable. Adds a query param to the default ignore list for step 3 matching and display (`_wpnonce`, `ver`, `_`, `_locale`). Use it for a site-specific volatile param -- generic names like `v` or `t` are deliberately not ignored by default, since they can carry real state (an API version, a tab filter). |
| `--out`                | Write the report to a file (in addition to stdout).                                                                                                                                                                                                                                                                |
| `--headed`             | Run the browser headed, for watching the capture happen.                                                                                                                                                                                                                                                           |

### Two-step alternative

If pausing mid-command inside one process is awkward (e.g. flipping the flag needs a separate
terminal), capture and diff separately:

```
node bin/verify-port.js capture --url <url> --user admin --pass <password> --out off.json
# flip the flag
node bin/verify-port.js capture --url <url> --user admin --pass <password> --out on.json
node bin/verify-port.js diff --before off.json --after on.json --out report.md
```

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

- Only with flag off (0):
  - none
- Only with flag on (1):
  - `GET https://example.jurassic.ninja/wp-content/plugins/jetpack/design-tokens.css` -> 404
- Status code changed (0):
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
[#52096](https://github.com/Automattic/jetpack/pull/52096)) were in RTL and colour-scheme, not
in anything steps 2 or 3 here would have caught. The geometry side extends cheaply: capture the
same targets with the page in `dir="rtl"` (content column must not clip under the admin menu)
and with a non-default admin colour scheme active (the backdrop must follow the menu colour,
per `class-wp-build-admin-frame.php`), and diff against the LTR / default-scheme capture instead
of against flag-off. The network side has nothing to add for either -- same requests either way
-- so steps 5 and 6 would each need their own geometry-only assertions in `diff.js`, not a new
network check.

## Testing

```
pnpm test
```

Runs `src/*.test.js` against the fixtures in `src/fixtures.js` -- the diff logic (`diff.js`) and
report formatting (`report.js`), which need no browser. `capture.js` (the Playwright half) is
not unit-tested: it needs a real Chromium against a real site, which this repo's sandbox can't
run (no GPU). Verify it by hand against a Jurassic Ninja site.
