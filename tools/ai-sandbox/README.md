# Jetpack AI Sandbox

Experimental AI-first development environment for the Jetpack monorepo.

⚠️ Not production-ready.  
⚠️ Do not use for core development without review.  
⚠️ The compose setup mounts `${HOME}/.claude` into the container — host Claude auth tokens are accessible to processes running in the sandbox. Do not share or commit that directory.

---

## Quick Start

```bash
cd tools/ai-sandbox
docker compose up -d --build
docker exec -it -u dev jetpack-ai-sandbox bash
gh auth login
gh auth setup-git
pnpm install
```

---

## wp-verify (Playwright UI verification)

The `wp-verify` stack runs Playwright tests against a real WordPress + Gutenberg instance for `/wp-admin` UI verification. It's an opt-in Compose profile — only starts when explicitly requested.

Host-side runs require Playwright + `@playwright/test` installed globally once (the sandbox container has them pre-installed via the `Dockerfile`):

```bash
npm install -g playwright@1.48.2 @playwright/test@1.48.2
```

```bash
# Bring up the WP + MySQL + WPCLI stack. The script returns once
# `docker compose up -d` finishes — at that point MySQL and WordPress
# have passed their healthchecks, but wpcli is still running its
# `wp core install` + `wp plugin activate gutenberg` setup. Tail its
# logs and wait for `sleep infinity` (the post-setup keep-alive) before
# running Playwright:
#   docker logs -f jetpack-ai-wpcli   # ready when you see: sleep infinity
tools/ai-sandbox/wp-verify.sh up

# Run Playwright tests from the repo root. NODE_PATH points node at the global
# install so the Playwright config can resolve `@playwright/test` — wp-verify
# isn't a pnpm workspace package, so `pnpm exec` wouldn't find it locally.
WP_BASE="http://localhost:${WP_VERIFY_HOST_PORT:-18080}" \
  NODE_PATH=$(npm root -g) \
  playwright test --config tools/ai-sandbox/wp-verify/playwright.config.ts

# Tear down
tools/ai-sandbox/wp-verify.sh down
```

Env vars:

- `WP_BASE` — target URL for Playwright. Defaults to `http://wordpress` inside the sandbox container; set explicitly to `http://localhost:${WP_VERIFY_HOST_PORT:-18080}` when running from the host.
- `WP_VERIFY_HOST_PORT` — host port published by the WordPress container (default `18080`, picked from the IANA-unassigned range to avoid clashing with common dev services on `8080`; override if `:18080` is in use).
- `WP_VERIFY_INSTANCE` — optional suffix appended to all wp-verify container names (`jetpack-ai-sandbox-<INSTANCE>`, `jetpack-ai-mysql-<INSTANCE>`, etc.) so multiple parallel agent workspaces can coexist on one Docker daemon. Unset = default unsuffixed names.

---

## Verify Environment

```bash
node -v
pnpm -v
php -v
composer --version
pnpm exec jetpack --help
```

Expected: Node 24.x, pnpm 10.x, PHP 8.4.x, Composer 2.9.2

---

## Start Claude

**First time only** — complete the OAuth login before starting a remote session:

```bash
claude
```

Follow the login prompt (use **claude.ai**, not API key), then exit with `/exit`.

### Option A — Control from claude.ai/code or Desktop app (recommended)

```bash
IS_SANDBOX=1 claude --dangerously-skip-permissions --remote-control "my-agent-jetpack"
```

This starts a remote-controlled session. Open https://claude.ai/code (or the Claude Desktop app → Remote sessions) and the session appears automatically. You control the agent from the browser or Desktop app; the CLI just keeps it alive.

⚠️ **Keep the CLI running** — closing it ends the session. Use tmux (see below) to keep it alive after disconnecting.

`--dangerously-skip-permissions` removes interactive permission prompts inside the container. The pre-push scope gate enforces what can be pushed — the flag removes friction for the agent, while the gate enforces code scope at push time.

### Option B — Interactive terminal session

```bash
IS_SANDBOX=1 claude --dangerously-skip-permissions
```

Standard interactive Claude Code session in the terminal. No remote control — you type directly in the container.

---

## Optional: Keep Claude Running

One-liner to start a detached tmux session with Claude already running:

```bash
tmux new-session -d -s my-agent "IS_SANDBOX=1 claude --dangerously-skip-permissions --remote-control my-agent-jetpack"
```

Or start tmux manually, then run Claude inside:

```bash
tmux new -s my-agent
```

Detach:  
Ctrl-b d

Reattach:

```bash
tmux attach -t my-agent
```

---

## Pre-push Gates

The container enforces two checks on every `git push` via `core.hooksPath`:

**Scope gate** — rejects pushes that touch files outside:
- `projects/packages/premium-analytics/**`
- `pnpm-lock.yaml`

**Build gate** — runs `pnpm build` for `premium-analytics` if its files changed. Push is blocked on build failure.

These gates are active inside the container only. The host uses standard husky hooks.

---

## Validation

```bash
git status
git diff --stat
git diff
```

Ensure changes stay within `projects/packages/premium-analytics/`.

---

## Troubleshooting

Container issues:

```bash
docker compose up -d --build
docker ps
```

Claude not connecting:

- Restart Claude
- Ensure it stays running

OAuth error:

- Retry login

1M context error:

```text
/model
```

→ select standard

---

## Purpose

- Test AI-assisted workflows
- Isolate experiments from production
- Enable safe iteration with agents

---

## Status

Experimental / subject to change
