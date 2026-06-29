---
name: jetpack-screenshot-local
description: >
  Capture before/after UI screenshots of a Jetpack change against a per-agent local docker
  WordPress (reachable via Jurassic Tube tunnel `https://jp-<agent>.jurassic.tube/` or
  `http://localhost:<port>/`), then attach them to a PR comment via GitHub's user-attachments
  uploader so they render inline forever on GitHub's CDN — no `screenshots/*` git refs, no repo
  bloat, nothing pulled into dev clones. Counterpart to the Jurassic-Ninja-targeted
  `jetpack-screenshot` skill — pick this one when the agent already has a docker env up via
  `jetpack-dev-env`. Use when the user says "before/after screenshots from my docker env",
  "screenshot via the JT tunnel", "/jetpack-screenshot-local", or when an agent is finishing
  a UI-touching PR and `jp-<agent>.jurassic.tube` is reachable.
allowed-tools: Bash(git rev-parse:*), Bash(git remote:*), Bash(git diff:*), Bash(git checkout:*), Bash(git stash:*), Bash(git status:*), Bash(git fetch:*), Bash(gh:*), Bash(jp:*), Bash(pnpm:*), Bash(curl:*), Bash(mktemp:*), Bash(mkdir:*), Bash(cat:*), Bash(node:*), Bash(npm:*), Bash(command -v:*), Bash(magick:*), Bash(basename:*), Bash(printf:*), Read
---

# Jetpack Screenshot — Local Docker via Playwright

Capture real-screen before/after screenshots from the per-agent local docker WP env using **Playwright** (headless Chromium), then attach them to a PR comment via GitHub's **user-attachments** uploader — the same `/upload/policies/assets` backend the comment editor's drag-and-drop / attach-file button calls. GitHub hosts the images on its own CDN (`user-attachments/assets/<uuid>`, re-signed per render for every viewer including anonymous ones), so they render inline forever with **no `screenshots/*` git refs, no repo bloat, and nothing pulled into dev clones**.

This is the **local-docker** variant. For Jurassic Ninja (`*.jurassic.ninja`) sites, use the existing `jetpack-screenshot` skill instead.

> **Why this upload path?** Verified 2026-05-29 against `Automattic/jetpack`:
> - `gh`/the REST+GraphQL API **cannot** create user-attachments — there's no public endpoint; it's a github.com web flow requiring a session cookie + CSRF token, not a PAT.
> - The upload is driven by **direct HTTP to `/upload/policies/assets`** (carrying the saved session cookies via Playwright's request context) — *not* by DOM-clicking the editor. That dodges GitHub's ongoing React migration of the comment UI: the only scraped values are two stable `<file-attachment>` data attributes, and everything else is API calls. Far more robust than driving the composer.
> - Capture still uses Playwright (headless Chromium): `html2canvas`-style libraries break on WP admin's CSS `color()` function, and Playwright writes a real PNG at the requested `viewport` in one call.

## Prerequisites

1. **Node + npm** on PATH. Playwright + cached Chromium is installed into a per-skill cache dir on first run (~5s after the initial install). On macOS the browsers live at `~/Library/Caches/ms-playwright/`.
2. **A reachable local-docker target** — bring it up via `jetpack-dev-env` first if it isn't already. The pre-flight check below halts before any builds when it isn't.
3. **A saved GitHub web session** at `$PWDIR/gh-state.json` (Playwright `storageState`). The user-attachments upload needs a logged-in github.com **session cookie** — a `gh` token won't do. This is a **one-time** setup (the session is long-lived); the publish step re-runs it automatically if the file is missing or expired:

   ```bash
   PWDIR="$HOME/.cache/jetpack-screenshot-pw"; mkdir -p "$PWDIR"
   cat > "$PWDIR/gh-login.mjs" <<'EOF'
   import { chromium } from 'playwright';
   const STATE = process.env.GH_STATE;
   const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
   const page = await (await browser.newContext({ viewport: null })).newPage();
   await page.goto('https://github.com/login', { waitUntil: 'domcontentloaded' });
   console.log('>>> Log into GitHub (incl. 2FA) in the opened window. It saves and closes itself.');
   const deadline = Date.now() + 300000;
   let me = null;
   while (Date.now() < deadline) {
     me = await page.locator('meta[name="user-login"]').getAttribute('content').catch(() => null);
     if (me) break;
     await page.waitForTimeout(2000);
   }
   if (!me) { console.log('LOGIN_NOT_DETECTED'); process.exit(1); }
   await page.context().storageState({ path: STATE });
   console.log('LOGGED_IN_AS=' + me);
   await browser.close();
   EOF
   GH_STATE="$PWDIR/gh-state.json" node "$PWDIR/gh-login.mjs"
   ```

   A maximized "Google Chrome for Testing" window opens (a separate app from the user's normal Chrome — tell them to look for it / Cmd-Tab; `osascript -e 'tell application "Google Chrome for Testing" to activate'` brings it forward). The user logs in once; the session persists for reuse. **The window is interactive — only the user can complete the login; never attempt to type their credentials.**

## Pre-flight checks

### 1. On a feature branch (not trunk) with an open PR
```bash
git rev-parse --abbrev-ref HEAD
gh pr view --json number,url -q '.number'   # the comment target; stop if there's no PR
```
The before/after build dance checks out the baseline and back, and the screenshots are posted as a comment on this PR. If HEAD is `trunk` or there's no PR for the branch, stop.

### 2. Origin is `Automattic/jetpack`
```bash
git remote get-url origin
```
Expect `github.com:Automattic/jetpack` (SSH or HTTPS form). The upload reads the repo id from the PR page, so it isn't hard-coded — but this skill is scoped to the jetpack monorepo.

### 3. No uncommitted changes
```bash
git status --porcelain
```
The flow checks out the baseline branch (usually `trunk`) for "before" and back to the feature branch for "after". Uncommitted changes would be lost. Stop if non-empty.

### 4. Node available
```bash
command -v node && command -v npm
```
If absent, stop and ask the user to install Node before continuing.

### 5. Target URL is reachable
```bash
BASE_URL="https://jp-<agent>.jurassic.tube"   # or http://localhost:<WP>
curl -fsS -o /dev/null -m 5 -w '%{http_code}\n' "$BASE_URL/wp-login.php" || echo "DOWN"
```
Expect `200`. Non-200 is often a stale-build PHP fatal — check with `curl -s "$BASE_URL/" | head -3`. If down, run `jetpack-dev-env` (sub-command `up`) and / or `jetpack-build-matrix` for the affected feature before continuing. Don't burn a multi-minute build on a target that doesn't load.

## Inputs

Ask once, concisely:
- **Admin paths** as `slug=path` pairs — e.g. `firewall=/wp-admin/admin.php?page=jetpack-protect#/firewall`. One or more.
- **Baseline** — `trunk` (default) or a different branch / commit.
- **Viewport** — default `1440x900`.
- **Feature** for the build matrix — derived from the diff:
  ```bash
  git diff --name-only origin/trunk...HEAD | grep '^projects/plugins/' | cut -d/ -f3 | sort -u
  ```
  If exactly one plugin is touched, use it; otherwise ask which to feed `jetpack-build-matrix`.
- **Base URL** — auto-derived from `<agent>` (`https://jp-<agent>.jurassic.tube/`) when the JT tunnel is reachable; falls back to `http://localhost:<WP>/` otherwise.
- **PR** — the pull request to attach the comment to. Auto-detect with `gh pr view --json number,url`; only ask if the branch has no PR yet.

## Workflow

### 1. Allocate dirs

```bash
OUT=$(mktemp -d -t jp-ss-local.XXXXXX)
PWDIR="$HOME/.cache/jetpack-screenshot-pw"
mkdir -p "$PWDIR"
```

`OUT` is per-run (PNGs); `PWDIR` is the cached Playwright install (one-time install across runs).

### 2. Install Playwright (idempotent)

```bash
if [ ! -d "$PWDIR/node_modules/playwright" ]; then
    (cd "$PWDIR" && npm init -y > /dev/null && npm install playwright --no-audit --no-fund --silent)
fi
```

The install pulls the matching Chromium build into `~/Library/Caches/ms-playwright` if it isn't already there. After the first run this step is a no-op.

### 3. Write the capture script

Save to `"$PWDIR/capture.mjs"`:

```js
import { chromium } from 'playwright';

const BASE   = process.env.BASE_URL;
const OUT    = process.env.OUT;
const PREFIX = process.env.PREFIX || 'shot';
const USER   = process.env.WP_USER || 'wordpress';
const PASS   = process.env.WP_PASS || 'wordpress';
const VW     = +(process.env.VIEWPORT_W || 1440);
const VH     = +(process.env.VIEWPORT_H || 900);
const PATHS  = JSON.parse(process.env.PATHS);   // [{slug, path}, ...]

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH } });
const page = await ctx.newPage();

await page.goto(BASE + '/wp-login.php', { waitUntil: 'domcontentloaded' });
if (await page.locator('a#wp-login-with-pw').count()) {
    await page.locator('a#wp-login-with-pw').click();
}
await page.fill('#user_login', USER);
await page.fill('#user_pass',  PASS);
await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    page.locator('#wp-submit').click(),
]);

// Jetpack Protect math captcha — addition challenge, deterministic.
if (await page.locator('text=/Please solve this math problem/').count()) {
    const txt = await page.locator('body').textContent();
    const m = txt.match(/(\d+)\s*\+\s*(\d+)\s*=/);
    if (!m) throw new Error('captcha format unexpected: ' + txt.slice(0, 200));
    await page.locator('input[type="text"], input[type="number"]').first().fill(String(+m[1] + +m[2]));
    await Promise.all([
        page.waitForLoadState('domcontentloaded'),
        page.locator('button:has-text("Continue"), input[type="submit"]').first().click(),
    ]);
    if (page.url().includes('wp-login.php')) {
        await page.fill('#user_login', USER);
        await page.fill('#user_pass',  PASS);
        await Promise.all([
            page.waitForLoadState('domcontentloaded'),
            page.locator('#wp-submit').click(),
        ]);
    }
}

if (page.url().includes('action=confirm_admin_email')) {
    await page.goto(BASE + '/wp-admin/', { waitUntil: 'domcontentloaded' });
}

for (const { slug, path } of PATHS) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const out = `${OUT}/${PREFIX}-${slug}.png`;
    await page.screenshot({ path: out, fullPage: false });
    console.log(`saved=${out} url=${page.url()}`);
}

await browser.close();
```

### 4. Capture baseline (`before`)

```bash
git fetch origin trunk
git checkout trunk           # or the user-specified baseline
```

Run the **full four-layer build** for the feature via `jetpack-build-matrix` (sub-command `full`). The docker env mounts the monorepo source; no rsync.

Then run the script with `PREFIX=before`:

```bash
PATHS='[{"slug":"firewall","path":"/wp-admin/admin.php?page=jetpack-protect#/firewall"}]'
BASE_URL="$BASE_URL" OUT="$OUT" PREFIX=before PATHS="$PATHS" \
    node "$PWDIR/capture.mjs"
```

### 5. Apply the PR branch (`after` state)

```bash
git checkout -      # back to the feature branch
```

Re-run `jetpack-build-matrix` (sub-command `full`) for the same feature. If a build fails, stop and report — don't proceed (the after state would be misleading).

### 6. Capture after

```bash
BASE_URL="$BASE_URL" OUT="$OUT" PREFIX=after PATHS="$PATHS" \
    node "$PWDIR/capture.mjs"
```

### 7. Upload to GitHub user-attachments via the private API

Write `"$PWDIR/gh-upload-api.mjs"` once (idempotent), then run it with the list of PNGs. It scrapes the two stable upload tokens off the PR page (`data-upload-repository-id` + the `.js-data-upload-policy-url-csrf` value), then does the three-call upload — request policy → POST bytes to storage → finalize — entirely over HTTP with the saved session cookies. No DOM driving.

```js
// $PWDIR/gh-upload-api.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const STATE = process.env.GH_STATE, PAGE = process.env.PAGE_URL, FILES = JSON.parse(process.env.FILES);
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ storageState: STATE });
const page = await ctx.newPage();
await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
const tok = await page.evaluate(() => {
	const fa = document.querySelector('file-attachment');
	return { repoId: fa?.getAttribute('data-upload-repository-id'),
		policyUrl: fa?.getAttribute('data-upload-policy-url') || '/upload/policies/assets',
		csrf: fa?.querySelector('.js-data-upload-policy-url-csrf, input[data-csrf]')?.value };
});
if (!tok.repoId || !tok.csrf) throw new Error('TOKENS_NOT_FOUND ' + JSON.stringify(tok)); // stale session or UI change
const me = await page.locator('meta[name="user-login"]').getAttribute('content').catch(() => null);
if (!me) throw new Error('NOT_LOGGED_IN: re-run gh-login.mjs'); // storageState expired
const api = page.request;
const out = [];
for (const f of FILES) {
	const buf = readFileSync(f.path), mime = f.mime || 'image/png', name = f.path.split('/').pop();
	const polRes = await api.post('https://github.com' + tok.policyUrl, { headers: { Accept: 'application/json' },
		multipart: { name, size: String(buf.length), content_type: mime, authenticity_token: tok.csrf, repository_id: tok.repoId } });
	if (!polRes.ok()) throw new Error('POLICY_FAIL ' + polRes.status() + ' ' + (await polRes.text()).slice(0, 300));
	const pol = await polRes.json();
	const upRes = await api.post(pol.upload_url, { multipart: { ...pol.form, file: { name, mimeType: mime, buffer: buf } } });
	if (![200, 201, 204].includes(upRes.status())) throw new Error('STORAGE_FAIL ' + upRes.status());
	const finUrl = 'https://github.com' + (pol.asset_upload_url || ('/upload/policies/assets/' + pol.asset.id));
	const finTok = pol.asset_upload_authenticity_token || pol.upload_authenticity_token;
	const finRes = await api.put(finUrl, { headers: { Accept: 'application/json' }, multipart: { authenticity_token: finTok } });
	if (!finRes.ok()) throw new Error('FINALIZE_FAIL ' + finRes.status() + ' ' + (await finRes.text()).slice(0, 300));
	out.push({ slug: f.slug, label: f.label, href: pol.asset.href });
}
console.log('RESULT=' + JSON.stringify(out));
await b.close();
```

```bash
PR_URL="$(gh pr view --json url -q .url)"
FILES="$(node -e 'const fs=require("fs"),d=process.argv[1];const f=fs.readdirSync(d).filter(x=>/^(before|after)-.*\.png$/.test(x)).map(x=>({slug:x.replace(/^(before|after)-/,"").replace(/\.png$/,""),label:x.startsWith("before")?"before":"after",path:d+"/"+x}));process.stdout.write(JSON.stringify(f))' "$OUT")"
RESULT="$(GH_STATE="$PWDIR/gh-state.json" PAGE_URL="$PR_URL" FILES="$FILES" node "$PWDIR/gh-upload-api.mjs" 2>&1 | sed -n 's/^RESULT=//p')"
echo "$RESULT"   # [{slug,label,href:"https://github.com/user-attachments/assets/<uuid>"}, ...]
```

If the script prints `NOT_LOGGED_IN` or `TOKENS_NOT_FOUND`, the session expired — re-run the one-time `gh-login.mjs` (Prerequisites #3) and retry. These are the only two recoverable failure modes; both are session/UI issues, not per-image.

### 8. Post the before/after comment on the PR

GitHub re-signs each `user-attachments/assets/<uuid>` URL server-side at render time, so the canonical URL is what goes in the comment body (it renders for everyone, including anonymous viewers — verified). Build the body with a small node script (pairs `before`/`after` per slug into a table) and post with `--body-file` — **don't** assemble the markdown inline in bash; the URLs and table pipes break shell quoting.

```js
// $PWDIR/gh-comment-body.mjs  — argv: RESULT-json, BASE_URL, VIEWPORT
const res = JSON.parse(process.argv[2]), base = process.argv[3] || '', vp = process.argv[4] || '';
const bySlug = {};
for (const r of res) (bySlug[r.slug] ??= {})[r.label] = r.href;
let md = `## Real-screen before / after\n\nCaptured via local docker (\`${base}\`) at ${vp}.\n\n`;
for (const [slug, m] of Object.entries(bySlug))
	md += `**${slug}**\n\n| Before | After |\n|---|---|\n| ${m.before ? `![before](${m.before})` : '—'} | ${m.after ? `![after](${m.after})` : '—'} |\n\n`;
process.stdout.write(md);
```

```bash
node "$PWDIR/gh-comment-body.mjs" "$RESULT" "$BASE_URL" "$VIEWPORT" > "$OUT/comment-body.md"
COMMENT_URL="$(gh pr comment "$(gh pr view --json number -q .number)" --body-file "$OUT/comment-body.md")"
echo "$COMMENT_URL"
```

Re-runs post a fresh comment (the images are immutable CDN assets; an old comment can be edited or minimized if desired). Nothing is force-pushed and the working tree is never touched.

## Output

```
BASE_URL: <local or tunnel URL used>
SHOTS: <count>
PR: #<number>
COMMENT_URL: <url of the posted before/after comment>
UPLOADED: yes | no
LOCAL_OUT: <temp dir path>     # PNGs kept so steps 7–8 can be retried without re-capturing
```

## Quick-preview alternative

For a one-off "does this look right?" sanity check (no PR publish), `mcp__claude-in-chrome__computer` with `action: "screenshot"` renders WP admin perfectly because it uses the user's authenticated browser session — no headless captcha challenge, no html2canvas color-function issue. The image arrives as an inline content block visible to the model only; **no usable disk path** is exposed, so it can't feed the upload step. Use Playwright for any PR.

## Notes

- **Privacy** — uploaded user-attachments are public (GitHub re-signs them for any viewer of a public-repo PR, anonymous included). Anything captured becomes public. Don't point captures at pages that could expose private data (site-owner emails, tokens). The per-agent docker env is created via `--clone-from dev` — generally safe, but inspect what's on screen before publishing. Note user-attachments **can't be hard-deleted** via API once posted — only the referencing comment can be removed (which orphans, but doesn't purge, the asset).
- **Why not git refs / releases / raw side-repo?** Earlier this skill force-pushed PNGs to `refs/heads/screenshots/<branch>`, which bloated the repo and got pulled into every clone. Release assets and `raw.githubusercontent.com` were evaluated as replacements: release-download URLs 302 to short-lived signed URLs that **404 anonymously**, and `raw` requires a committed blob somewhere. user-attachments are the only host that's GitHub-native, permanent, anonymously-renderable, and stores nothing in any git tree. `gh` cannot create them (no API endpoint) — hence the cookie-authenticated `/upload/policies/assets` flow.
- **Jetpack Protect math captcha** — Brute-force protection challenges any headless login with a "N + M = ?" prompt. The capture script solves it deterministically and re-submits the login. If Protect upgrades to a non-arithmetic challenge, the script throws `captcha format unexpected: …` — that's the trigger to update the regex.
- **`a#wp-login-with-pw`** — the WP.com / SSO entry link only appears on some configurations (e.g. when the `wpcom-vip-go` mu-plugin or specific Jetpack Connect features are active). The script checks `count()` first and only clicks when present; on a vanilla docker the standard inputs are visible by default.
- **`confirm_admin_email` redirect** — handled by navigating directly to `/wp-admin/` after the redirect URL is detected. Don't try to click "The email is correct" via locator — the link text varies by WP version.
- **Recovery** — if capture or build fails partway through, the local temp dir still contains whatever was captured. The `LOCAL_OUT` path lets the upload (steps 7–8) be retried without re-capturing. If the upload prints `NOT_LOGGED_IN`, re-run the one-time `gh-login.mjs` (Prerequisites #3).
- **Branch hygiene** — the `git checkout trunk` and back-to-feature-branch pattern depends on a clean tree. If the working copy ever ends up dirty after a run (interrupted build, etc.), `git stash list` is the first place to look.
- **Agent identity comes from `pwd`, not the branch.** The atlas / nova / sage / echo / raven name is `basename "$PWD"` with the `jetpack-` prefix stripped — a clone in `~/A8C/jetpack-atlas` is the **atlas** agent regardless of whether the working branch is `atlas/foo` or `raven/bar`. The Jurassic Tube subdomain (`jp-<agent>.jurassic.tube`) and the dev-env port allocation must match the directory, not the branch namespace.
- **Forcing interactivity-API blocks visible on the front end** — Search 3.0 blocks (no-results, load-more, results-count, sort-control, …) carry `data-wp-bind--hidden="!state.showNoResults"` and stay hidden when not inside a real Search Results context. Inject before screenshotting via `page.evaluate(...)`:
  ```js
  await page.evaluate(() => {
      document.querySelectorAll('.wp-block-jetpack-no-results').forEach(el => {
          el.removeAttribute('hidden');
          el.removeAttribute('data-wp-bind--hidden');
          el.style.display = '';
      });
  });
  ```
- **Inserting test content for screenshot pages** — when you need a page with specific block markup to screenshot, create it via WP REST using Playwright's authenticated request context (no html2canvas / nonce gymnastics):
  ```js
  const res = await page.request.post(BASE + '/wp-json/wp/v2/pages', {
      data: { title: 'screenshot fixture', status: 'publish', content: '<!-- wp:jetpack/no-results /-->' }
  });
  const id = (await res.json()).id;
  await page.goto(`${BASE}/wp-admin/post.php?post=${id}&action=edit`);
  ```
