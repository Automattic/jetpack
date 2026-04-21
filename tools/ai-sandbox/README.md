# Jetpack AI Sandbox

Experimental AI-first development environment for the Jetpack monorepo.

⚠️ Not production-ready.  
⚠️ Do not use for core development without review.

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

```bash
cd ~/jetpack
IS_SANDBOX=1 claude --dangerously-skip-permissions --remote-control "my-agent-jetpack"
```

On first run, follow the login prompt (use **claude.ai**, not API key).

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

## Validation

```bash
git status
git diff --stat
git diff
```

Ensure changes stay within `projects/plugins/premium-analytics/`.

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
