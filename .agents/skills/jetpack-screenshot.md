---
description: >
  Capture before/after UI screenshots of a Jetpack change on a live Jurassic Ninja site
  and attach them to the PR body with `gh pr edit --attach`.
  Use when the user wants before/after screenshots for a Jetpack PR, mentions
  "jurassic ninja screenshot", "JN screenshot", "real-screen before/after",
  or says "/jetpack-screenshot". Works with any browser automation tool available
  to the agent (chrome-devtools MCP, Playwright MCP, cmux browser, or similar)
  and leans on jetpack-test-jurassic-ninja for syncing plugin state.
allowed-tools: Bash(git rev-parse:*), Bash(git diff:*), Bash(mktemp:*), Bash(command -v:*), Bash(magick:*), Bash(gh pr view:*), Bash(gh pr edit:*), Bash(gh api repos/Automattic/jetpack --jq .id), Bash(awk:*), Bash(curl -sL -H:*), Bash(file:*), Bash(grep:*), Bash(cut:*), Bash(sort:*), Bash(cat:*), Bash(echo:*), Write
---

# Jetpack Screenshot — Before/After on Jurassic Ninja

Capture real-screen before/after screenshots on a Jurassic Ninja site for a Jetpack PR, then attach them to the PR body with `gh pr create --attach` or `gh pr edit --attach`. GitHub uploads each file as a `user-attachments` asset, so no branch or ref is pushed.

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

If the branch is `trunk`, stop — the "after" state is this branch's diff; run this from the feature branch.

### 2. Pick the upload route

Use the first route this environment supports; step 7 has the commands for each:

1. **`gh --attach`** (default): `gh pr edit --help | grep -q -- '--attach'` succeeds.
2. **Minted URLs**: `gh` is older but authenticated, and the user has write access to the repo.
3. **Browser upload**: a connected browser tool is logged in to GitHub as the user.
4. **Manual**: none of the above. Hand the user the PNG paths and the markdown block to drag into the PR body.

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

Don't fail the skill if the composite step fails — just fall back to attaching the raw `before-*.png` / `after-*.png` pair.

### 6. Write the markdown block

Write the block to `$OUT/screenshots.md`. Reference each image by the same relative path that step 7 passes to `--attach` (`./before-<slug>.png`); `gh` rewrites each matching reference to the uploaded URL. Keep the two marker comments: step 7 uses them to replace the block on a re-run. Example with a two-column table:

```markdown
<!-- jetpack-screenshot:start -->
## Real-screen before / after

Captured on a live Jurassic Ninja site at `<admin-path>` at 1440×900.

| Before | After |
|---|---|
| ![before](./before-<slug>.png) | ![after](./after-<slug>.png) |
<!-- jetpack-screenshot:end -->
```

If a side-by-side composite was produced, offer that markdown variant instead.

### 7. Attach to the PR

Uploads are permanent and public, so show the user the PNG paths and get a yes before this step.

If the PR exists, drop any block an earlier run added, append the new one, and attach the files. The marker-count check stops the chain before the edit when one marker is missing, so ask the user to fix the body. The subshell runs `gh` from `$OUT` so the relative paths resolve:

```bash
PR=<number>
(
    cd "$OUT" &&
    gh pr view "$PR" -R Automattic/jetpack --json body --jq .body > original-body.md &&
    [ "$(grep -c 'jetpack-screenshot:start' original-body.md)" = "$(grep -c 'jetpack-screenshot:end' original-body.md)" ] &&
    awk '/<!-- jetpack-screenshot:start -->/{skip=1} !skip{print} /<!-- jetpack-screenshot:end -->/{skip=0}' original-body.md > body.md &&
    { echo; cat screenshots.md; } >> body.md &&
    gh pr edit "$PR" -R Automattic/jetpack --body-file body.md \
        --attach ./before-<slug>.png --attach ./after-<slug>.png
)
```

Pass one `--attach` per PNG that the block references. If the PR does not exist yet, hand the block and the PNG paths to whatever creates the PR, which passes the same `--attach` flags to `gh pr create`. A top-level PR comment takes the same flags on `gh pr comment`.

If a PNG is over 10 MiB, downscale it or convert it to JPEG, or attach the before and after images separately instead of the composite.

After the edit, read the body with `gh pr view --json body` and fail if it still contains `](./`.

#### Minted URLs: no `--attach`, or a review or inline comment

Use this route when `gh` has no `--attach`, and always for a review or inline comment: `gh pr review` and the review-comment API have no `--attach`, and a comment body only renders an asset URL that already exists. Mint one URL per image without posting anything (needs write access to the repo; 404 without it). Never post a `gh pr comment --attach` and delete it to get a URL: it notifies everyone anyway.

```bash
ID=$(gh api repos/Automattic/jetpack --jq .id)
gh api -X POST "https://uploads.github.com/user-attachments/assets?name=before-<slug>.png&content_type=image/png&repository_id=$ID" \
    -H 'Content-Type: application/octet-stream' --input "$OUT/before-<slug>.png" --jq .url
```

`curl -I` shows only the 302, so follow the redirect to check each URL before it goes in a body; anything but `200 image/png` is a failed upload, so mint it again:

```bash
curl -sL -H "Authorization: Bearer $(gh auth token)" -o "$OUT/check.png" -w '%{http_code} %{content_type}\n' <minted url> && file "$OUT/check.png"
```

Replace each `./before-<slug>.png` in the block with its minted URL, then post the comment, or build `body.md` as in the step 7 command, save it with `gh api -X PATCH repos/Automattic/jetpack/pulls/$PR -F body=@"$OUT/body.md"`, and read the body back to confirm it changed.

#### Browser upload

If minting returns 404, open the PR in the logged-in browser tool, edit the description, and upload each PNG to the editor's file input (for example `upload_file` in the chrome-devtools MCP). GitHub inserts one `user-attachments` URL per file; put those URLs in the block and save. If no browser tool is logged in to GitHub, fall back to the manual route.

## Notes

- **Privacy:** Jetpack is a public repo and attached files cannot be deleted. Anything captured becomes public. Don't point captures at pages that could expose private data (site-owner emails, tokens). Prefer a brand-new JN site.
- **Recovery:** if rsync or capture fails partway through, the local temp dir still contains whatever was captured — report the path so the user can retry step 7 manually.
