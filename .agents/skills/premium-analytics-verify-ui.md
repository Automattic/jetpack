---
description: >
  Start the wp-verify WordPress environment, build premium-analytics, navigate to the
  Analytics admin page with Playwright, and assert the dashboard root mounts without
  uncaught JS exceptions. Use after any premium-analytics UI change as the
  agent-verifiable step in the Definition of Done. Runs from inside `jetpack-ai-sandbox`
  (Docker socket + Playwright/Chromium baked into the image) or from the host
  (WordPress published to `localhost:${WP_VERIFY_HOST_PORT:-8080}`; host needs
  Playwright on PATH).
allowed-tools: Bash(docker:*), Bash(node:*), Bash(npx:*), Bash(playwright:*), Bash(npm:*), Bash(pnpm:*), Bash(bash:*), Bash(curl:*), Bash(sleep:*), Bash(test:*), Bash(mkdir:*), Bash(cat:*), Bash(cp:*), Bash(tr:*), Bash(sed:*), Bash(grep:*), Bash(git symbolic-ref:*), Bash(git rev-parse:*), Bash(git add:*), Bash(git diff:*), Bash(git commit:*), Bash(git remote:*), Bash(git rm:*), Write, Read
---

# premium-analytics UI Verification

Verify that the analytics dashboard mounts correctly in wp-admin after a premium-analytics build.

## Pre-flight

1. **Confirm Docker is reachable** (from either sandbox or host).
   Inside the sandbox, this is the mounted socket. On the host, it's the
   normal local Docker daemon. The wp-verify WP stack itself always runs
   under Docker — only the *caller* invoking Playwright varies between
   sandbox and host.
   ```bash
   docker info > /dev/null 2>&1 || { echo "Docker not reachable — start Docker (host) or run inside jetpack-ai-sandbox with socket mounted"; exit 1; }
   ```

2. **Confirm Playwright Test runner is installed globally.** The
   documented invocation uses `command -v playwright` (needs the binary
   on `PATH`) plus `NODE_PATH=$(npm root -g)` (npm's global
   node_modules dir) — both assume an npm global install, not a
   pnpm-local install (which puts binaries under `node_modules/.bin`
   and uses a different prefix). Sandbox image ships them globally
   already; host setups need `npm install -g`:
   ```bash
   command -v playwright > /dev/null 2>&1 || { echo "playwright binary not found on PATH — sandbox: rebuild image (docker compose -f tools/ai-sandbox/docker-compose.yml build jetpack-ai); host: 'npm install -g playwright @playwright/test && playwright install chromium'"; exit 1; }
   playwright test --version > /dev/null 2>&1 || { echo "@playwright/test runner not available — same install paths as above"; exit 1; }
   ```
   (If you prefer keeping playwright as a project-local dev dep instead
   of a global install, swap in `pnpm exec playwright test ...` for the
   invocation. The default skill body uses the global form because the
   sandbox image already provides it.)

3. **Confirm build artifacts exist:**
   ```bash
   test -f projects/packages/premium-analytics/build/build.php || {
     echo "Build artifacts missing — run: pnpm --filter=@automattic/jetpack-premium-analytics build"
     exit 1
   }
   ```
   If missing, build first:
   ```bash
   CI=true pnpm --filter='@automattic/jetpack-premium-analytics' build
   ```

## Step 1 — Start WordPress environment

`wp-verify.sh up` handles `JETPACK_HOST_PATH` detection internally. Works
from the repo root on the host or from inside `jetpack-ai-sandbox`. Pass
`WP_VERIFY_INSTANCE=<id>` and/or `WP_VERIFY_HOST_PORT=<port>` via the
environment if running parallel stacks (see `wp-verify.sh` header for the
constraints).

```bash
bash tools/ai-sandbox/wp-verify.sh up
```

`docker compose up -d` (which `wp-verify.sh` calls) does not pass
`--wait`, so it returns once all containers are *running* — not once all
are *healthy*. The `depends_on: condition: service_healthy` chain
guarantees that by the time wpcli is started, mysql and WordPress have
already passed their healthchecks (so WordPress is reachable). wpcli
itself has no healthcheck and starts immediately, but its `wp core install`
+ `wp plugin activate gutenberg` then run inside that container — that
work is what Step 2 waits for.

## Step 2 — Wait for wpcli setup to complete

wpcli's startup command (see `tools/ai-sandbox/docker-compose.yml`) runs
two sequential steps before reaching `sleep infinity`:

```sh
wp core is-installed || wp core install ...                   # step A
wp plugin is-active gutenberg || { wp plugin install ... && wp plugin activate gutenberg; }   # step B
sleep infinity
```

Probing `wp core is-installed` only confirms step A — step B's plugin
activation runs after, and Step 3's Playwright suite needs Gutenberg
active (premium-analytics' admin page uses Gutenberg APIs). Probe `wp
plugin is-active gutenberg` instead: it returns 0 only after step B
completes, which implies step A also did (sequential):

```bash
# Resolve the wpcli container name. Three cases:
# 1. Caller exported WP_VERIFY_INSTANCE explicitly — use it directly.
# 2. Inside a *suffixed* sandbox container with WP_VERIFY_INSTANCE
#    unset (compose doesn't propagate the env var into the container's
#    runtime env). Read the current container's compose project label
#    and back-derive the instance — same approach wp-verify.sh uses for
#    its own in-sandbox reconciliation.
# 3. On the host, or inside the default unsuffixed sandbox container.
#    Neither check below applies; WP_VERIFY_INSTANCE stays empty, the
#    suffix expansion below is empty, and the target is the historical
#    unsuffixed `jetpack-ai-wpcli` container.
if [ -z "${WP_VERIFY_INSTANCE:-}" ] && [ -f /.dockerenv ]; then
  PROJECT=$(docker inspect "$HOSTNAME" --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>/dev/null || true)
  case "$PROJECT" in
    ai-sandbox-*) WP_VERIFY_INSTANCE="${PROJECT#ai-sandbox-}" ;;
  esac
fi
WPCLI="jetpack-ai-wpcli${WP_VERIFY_INSTANCE:+-${WP_VERIFY_INSTANCE}}"

echo "Waiting for wpcli setup to complete (target: $WPCLI)..."
TRIES=0
until docker exec "$WPCLI" wp plugin is-active gutenberg --allow-root 2>/dev/null; do
  TRIES=$((TRIES + 1))
  [ $TRIES -gt 20 ] && echo "wpcli setup did not complete in time" && exit 1
  sleep 5
done
echo "wpcli setup complete."
```

The `${WP_VERIFY_INSTANCE:+-${WP_VERIFY_INSTANCE}}` suffix matches
container-name parameterization added in PR #42, so parallel stacks
(e.g. `WP_VERIFY_INSTANCE=foo`) target the right wpcli container. The
in-sandbox fallback reads the same `com.docker.compose.project` label
`wp-verify.sh` consults, so callers who `docker exec` into a suffixed
sandbox without re-exporting the env var still target the right stack.

## Step 3 — Run Playwright verification

Run the Playwright Test suite against the wp-verify environment. The
playwright config reads `WP_BASE` from the environment; pick the form
that matches where this skill is invoked:

**From inside `jetpack-ai-sandbox`** (default — `WP_BASE` unset, falls back to
`http://wordpress`, the docker-network hostname):

```bash
NODE_PATH=$(npm root -g) playwright test --config tools/ai-sandbox/wp-verify/playwright.config.ts
```

**From the host** (the wp-verify Docker stack publishes WordPress to
`localhost:${WP_VERIFY_HOST_PORT:-8080}` per
`tools/ai-sandbox/docker-compose.wp-verify.yml`):

```bash
WP_BASE=http://localhost:${WP_VERIFY_HOST_PORT:-8080} \
  NODE_PATH=$(npm root -g) \
  playwright test --config tools/ai-sandbox/wp-verify/playwright.config.ts
```

Host-side use requires the `playwright` binary on `PATH` plus
`@playwright/test` discoverable at `NODE_PATH=$(npm root -g)`. The sandbox
image installs both globally; host machines need
`npm install -g playwright @playwright/test && playwright install chromium`.
(Project-local `pnpm install` alone does not satisfy this — pnpm puts
binaries under `node_modules/.bin` and uses a different global prefix from
npm. Callers who prefer to keep playwright as a repo-local dev dep should
swap the invocation to `pnpm exec playwright test --config …` and drop
the `NODE_PATH=$(npm root -g)` prefix; the `WP_BASE` env var still
applies.)

The wp-verify Docker stack must still be running on the same host via
`bash tools/ai-sandbox/wp-verify.sh up` — this skill only does
verification; it doesn't bring the stack up or down.

`NODE_PATH=$(npm root -g)` is required because the sandbox image installs
`@playwright/test` globally; without it, the config file's
`import { defineConfig } from '@playwright/test'` in
`tools/ai-sandbox/wp-verify/playwright.config.ts` fails to resolve, since
standard Node module resolution from that file doesn't reach the global path.

The suite lives under `tools/ai-sandbox/wp-verify/tests/`:

- `dashboard-mount.spec.ts` — mount + heading, height-bounded, no zero-height SVG
- `pie-chart-tooltip.spec.ts` — skipped until a pie chart is rendered on the dashboard

The mount spec also writes a fresh screenshot to `/tmp/pa-verify/analytics-dashboard.png`,
which Step 4 commits.

Exit 0 = all specs passed (skipped counts as passed). Non-zero = the runner's terminal
output names the failing spec(s); rerun a single failing one with
`NODE_PATH=$(npm root -g) playwright test --config tools/ai-sandbox/wp-verify/playwright.config.ts <spec-name>`
to iterate.

The legacy `node tools/ai-sandbox/wp-verify/check.cjs` script is **deprecated** and kept
only as a temporary fallback. Do not invoke it for normal verification.

## Step 4 — Commit screenshot

On success, commit the screenshot and print a Markdown image snippet to embed in the PR description:

```bash
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null | tr '/' '-')
[ -z "$BRANCH" ] && { echo "Detached HEAD — run from a named branch"; exit 1; }
SCREENSHOT_DEST="docs/screenshots/${BRANCH}.png"
mkdir -p docs/screenshots
test -f /tmp/pa-verify/analytics-dashboard.png || { echo "Screenshot not found — re-run Step 3"; exit 1; }
cp /tmp/pa-verify/analytics-dashboard.png "$SCREENSHOT_DEST"
git add "$SCREENSHOT_DEST"
git diff --cached --quiet -- "$SCREENSHOT_DEST" || \
  git commit -m "chore: add wp-verify screenshot for ${BRANCH}" -- "$SCREENSHOT_DEST" || exit 1
git remote | grep -q '^fork$' && REMOTE=fork || REMOTE=origin
REPO=$(git remote get-url "$REMOTE" \
  | sed 's/.*github\.com[:/]\(.*\)\.git$/\1/' \
  | sed 's/.*github\.com[:/]\(.*\)$/\1/')
echo "$REPO" | grep -qE '^[^/]+/[^/]+$' || { echo "Could not derive repo slug from remote — check: git remote get-url $REMOTE"; exit 1; }
COMMIT=$(git rev-parse HEAD)
echo "![Analytics dashboard](https://raw.githubusercontent.com/${REPO}/${COMMIT}/docs/screenshots/${BRANCH}.png)"
```

Push the branch before pasting this URL into the PR description — the raw URL resolves
only after the commit is on the remote. The URL is pinned to the commit SHA so the image
reference remains stable as the branch grows. If the branch history is later rewritten
(rebase or force-push), re-run Step 4 and update the PR description link.

**Before merge:** remove the screenshot file so it is absent from the final tree:

```bash
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null | tr '/' '-')
[ -z "$BRANCH" ] && { echo "Detached HEAD — run from a named branch"; exit 1; }
git rm --ignore-unmatch "docs/screenshots/${BRANCH}.png"
git diff --cached --quiet -- "docs/screenshots/${BRANCH}.png" || \
  git commit -m "chore: remove wp-verify screenshot before merge" -- "docs/screenshots/${BRANCH}.png"
```

After the removal commit, a squash-merge produces a single commit that reflects the
final tree — which no longer contains the PNG. The raw URL remains reachable while
GitHub retains the object, long enough for reviewers.

## Step 5 — Report result

On success:
- `playwright test` exits 0 and prints a summary like `2 passed (2 skipped)` on a chartless dashboard — the zero-height-SVG test skips when no charts are present, and the `pie-chart-tooltip` spec is skipped until that task lands
- The screenshot is committed and visible in the PR description

On failure:
- `playwright test` exits non-zero; the list reporter names the failing spec
- For deeper inspection (trace, video, full-page screenshot of the failure), look in `/tmp/pa-verify/playwright-output/` — the config retains trace and video on failure
- Do NOT mark the Definition of Done as complete
- Fix the root cause and re-run from Step 3 (WordPress stays up between runs)

## Teardown (optional)

Leave WordPress running during the review cycle so subsequent verification rounds skip Step 1–2. Tear down only at the end of the cycle or when explicitly requested:

```bash
bash tools/ai-sandbox/wp-verify.sh down
```

Safe to run from inside `jetpack-ai-sandbox` — when in-container the script only stops the WP services (mysql, wordpress, wpcli) and does not touch the sandbox container itself.

## HARD rules

- Only run on a trusted single-user machine — either the developer's own host or the `jetpack-ai-sandbox` container on it. Both modes give the skill (and any Playwright spec it runs) Docker-equivalent capabilities: the sandbox via the mounted `/var/run/docker.sock`, the host via direct Docker CLI access. Do not run on shared / multi-tenant machines where other users could interact with the same WP instance.
- Never commit `/tmp/pa-verify/` contents.
- The admin credentials (`admin` / `password`) are for the throwaway test environment only — do not reuse elsewhere. The WP port is bound to `127.0.0.1` so it isn't LAN-reachable, but anyone with local access to the machine can reach it.
