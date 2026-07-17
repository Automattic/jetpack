---
description: >
  Capture before/after UI screenshots of a Jetpack change on a live Jurassic Ninja site
  and publish them to a screenshots ref on origin so they render in the PR body.
  Use when the user wants before/after screenshots for a Jetpack PR, mentions
  "jurassic ninja screenshot", "JN screenshot", "real-screen before/after",
  or says "/jetpack-screenshot". Works with any browser automation tool available
  to the agent (chrome-devtools MCP, Playwright MCP, cmux browser, or similar)
  and leans on jetpack-test-jurassic-ninja for syncing plugin state.
allowed-tools: Bash(git rev-parse:*), Bash(git remote:*), Bash(git hash-object:*), Bash(git mktree:*), Bash(git commit-tree:*), Bash(git update-ref:*), Bash(git push:*), Bash(git rev-list:*), Bash(git show-ref:*), Bash(git diff:*), Bash(mktemp:*), Bash(command -v:*), Bash(magick:*)
---

# Jetpack Screenshot — Before/After on Jurassic Ninja

Capture real-screen before/after screenshots on a Jurassic Ninja site for a Jetpack PR, then publish them to `refs/heads/screenshots/<branch>` on `origin` so they render inline in the PR body as `https://github.com/<org>/<repo>/raw/screenshots/<branch>/<file>.png`.

Two pieces must exist in the environment — verify both before starting:

1. **A browser automation tool** capable of: navigating to a URL, setting viewport size, waiting for load/idle, and capturing a PNG screenshot. Any of these is fine — pick whichever is connected, in this order of preference:
   - **chrome-devtools MCP** — look for tools like `navigate_page` / `take_screenshot`. Prefix varies by install (`mcp__chrome-devtools__*`, `mcp__plugin_<pkg>_chrome-devtools__*`, etc.).
   - **Playwright MCP** — look for `browser_navigate` / `browser_take_screenshot`.
   - **cmux browser** (`cmux browser open|navigate|wait|screenshot …`, if the cmux socket is present at `/tmp/cmux.sock`).
   - A locally installable headless option (`npx playwright screenshot …`, `puppeteer`, etc.) as a last resort.

   The rest of this skill refers to these as "the browser tool" — map each step to the equivalent call in whatever tool is available.
2. A reachable **Jurassic Ninja site** with admin auto-login. Use the `jetpack-test-jurassic-ninja` skill for syncing plugin state to it.

## Pre-flight Checks

### 1. On a PR branch (not trunk)

```bash
git rev-parse --abbrev-ref HEAD
```

If the branch is `trunk`, stop — the screenshots ref encodes the branch name; run this from the feature branch.

### 2. Remote is the Automattic Jetpack repo

```bash
git remote get-url origin
```

Expect `github.com:Automattic/jetpack` (SSH or HTTPS form). If not, stop and ask the user which remote to push screenshots to.

### 3. A browser automation tool is available

Inventory what's connected in the current agent session, in preference order (chrome-devtools MCP → Playwright MCP → cmux browser → local Playwright/Puppeteer CLI). Pick the first one that can do all four of: navigate, resize, wait for load, and capture a PNG to disk.

If none are available, tell the user:

> No browser automation tool is connected. Options: start the chrome-devtools MCP (`claude mcp list` to verify), connect a Playwright MCP, or run under cmux so `cmux browser` is reachable. Any of those is enough.

### 4. A ready JN site

Run `jetpack-test-jurassic-ninja`'s pre-flight to ensure a target site is reachable. Let that skill own site discovery, SSH/password handling, and creation guidance — don't restate it here.

## Workflow

Capture runs in two passes — **before** (pre-change baseline) and **after** (PR branch applied). The user decides what "before" means; the default is the current published state (from wp.org) already installed on the JN site. If the user wants trunk as the baseline, sync trunk first with `jetpack-test-jurassic-ninja`.

### 1. Agree on what to capture

Ask — once, concisely — for:
- **Admin path(s)** to capture, e.g. `/wp-admin/admin.php?page=jetpack-protect#/firewall`. Accept one or more.
- **Baseline** (`before` state): `wp.org` (default) or `trunk` (sync trunk via the JN skill first).
- **Viewport**: default `1440x900`, override on request.

Do not ask anything else — pick reasonable defaults for everything below.

### 2. Capture the baseline (`before`)

Ensure the baseline is in place on the JN site (no-op if baseline is "wp.org and Jetpack is already installed"; otherwise invoke `jetpack-test-jurassic-ninja` synced to `trunk`).

Allocate a temp dir once for all shots:

```bash
OUT=$(mktemp -d -t jp-ss.XXXXXX)
```

Open `https://{domain}/?auto_login` once, wait for the dashboard, and resize the viewport to the chosen size (default `1440×900`). Reuse the same page/surface for every path below — don't re-open or re-resize.

Then, for each admin path, use the browser tool to:

1. **Navigate** to the admin path.
2. **Wait** until the page is idle — a stable selector, `networkidle`, or `document.readyState === 'complete'`, whichever the browser tool supports.
3. **Capture** a viewport (not full-page) PNG and save it as `$OUT/before-<slug>.png`. Derive `<slug>` from the last path segment or a short hash — one `<slug>` per admin path.

Tool-specific hints:
- **chrome-devtools MCP**: `new_page` → `navigate_page` → `resize_page` → `wait_for` or `evaluate_script` → `take_screenshot` with `fullPage: false`.
- **Playwright MCP**: `browser_navigate` → `browser_resize` → `browser_wait_for` → `browser_take_screenshot` with `fullPage: false`.
- **cmux browser**: `cmux browser open` → `cmux browser $SURF navigate` → `cmux browser $SURF wait --load-state complete` → `cmux browser $SURF screenshot --out "$OUT/before-<slug>.png"`.
- **Local Playwright CLI**: `npx playwright screenshot --viewport-size=1440,900 --wait-for-timeout=2000 "$URL" "$OUT/before-<slug>.png"`.

### 3. Apply the PR branch (`after` state)

Invoke the `jetpack-test-jurassic-ninja` skill to rsync the plugin(s) modified by this branch. Determine the plugin from `git diff --name-only origin/trunk...HEAD | grep '^projects/plugins/' | cut -d/ -f3 | sort -u` — if exactly one plugin is touched, pass it; otherwise ask which to sync.

### 4. Capture after

Repeat the capture from step 2, saving each as `after-<slug>.png` in the same temp dir. Reuse the existing page/surface — navigate to the admin path and re-capture. Do not open a fresh page unless the previous one was closed.

### 5. (Optional) Side-by-side composite

If the user wants one image per path instead of two, stitch with ImageMagick when available:

```bash
if command -v magick >/dev/null; then
    for f in "$OUT"/before-*.png; do
        slug="${f##*/before-}"; slug="${slug%.png}"
        magick "$OUT/before-$slug.png" "$OUT/after-$slug.png" +append "$OUT/before-after-$slug.png"
    done
fi
```

Don't fail the skill if the composite step fails — just fall back to pushing the raw `before-*.png` / `after-*.png` pair.

### 6. Publish via git plumbing

Build a tree with only the PNGs and push to `refs/heads/screenshots/<branch>` on `origin` (force-update). This uses plumbing commands so the working tree is never touched. Pipe the loop directly into `git mktree` — accumulating entries via `$(printf '…\n')` strips trailing newlines and breaks multi-PNG runs.

```bash
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
REF="refs/heads/screenshots/${BRANCH}"

TREE="$(
    for png in "$OUT"/*.png; do
        printf '100644 blob %s\t%s\n' "$(git hash-object -w "$png")" "$(basename "$png")"
    done | git mktree
)"
COMMIT="$(git commit-tree "$TREE" -m "Screenshots for ${BRANCH}")"
git update-ref "$REF" "$COMMIT"
git push --force origin "$REF"
```

The ref is cheap, short-lived, and never merged — force-pushing on re-runs is the intended behavior.

### 7. Emit paste-ready markdown

Print one markdown block the user can paste into the PR body. Use `https://github.com/<org>/<repo>/raw/screenshots/<branch>/<file>.png` URLs. Example with a two-column table:

```markdown
## Real-screen before / after

Captured on a live Jurassic Ninja site at `<admin-path>` at 1440×900.

| Before | After |
|---|---|
| ![before](https://github.com/Automattic/jetpack/raw/screenshots/<branch>/before-<slug>.png) | ![after](https://github.com/Automattic/jetpack/raw/screenshots/<branch>/after-<slug>.png) |
```

If a side-by-side composite was produced, offer that markdown variant instead.

## Notes

- **Privacy:** Jetpack is a public repo and the screenshots ref is served from `raw.githubusercontent.com`. Anything captured becomes public. Don't point captures at pages that could expose private data (site-owner emails, tokens). Prefer a brand-new JN site.
- **Recovery:** if rsync or capture fails partway through, the local temp dir still contains whatever was captured — report the path so the user can retry step 6 manually.
