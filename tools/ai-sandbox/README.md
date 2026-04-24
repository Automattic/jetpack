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
docker exec -it jetpack-ai-sandbox bash
cd ~/jetpack
gh auth login
pnpm install
```

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
cd ~/jetpack
claude
```

Follow the login prompt (use **claude.ai**, not API key), then exit with `/exit`.

**Start remote session:**

```bash
IS_SANDBOX=1 claude --dangerously-skip-permissions --remote-control "my-agent-jetpack"
```

`--dangerously-skip-permissions` removes interactive permission prompts inside the container. The pre-push scope gate enforces what can be pushed — the flag removes friction for the agent, while the gate enforces code scope at push time.

Then open:  
https://claude.ai/code

The session will appear automatically.  
Keep Claude running — closing it ends the session.

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
