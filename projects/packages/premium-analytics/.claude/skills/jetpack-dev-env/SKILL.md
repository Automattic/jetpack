---
name: jetpack-dev-env
description: >
  Bring up (or tear down) a per-agent Jetpack docker WordPress environment with a Jurassic Tube
  tunnel for public access. Handles the fixed port allocation across the five named agents
  (atlas / nova / sage / echo / raven), the docker bring-up, the install no-op, and the JT
  tunnel start. Use when a task needs a live WP environment, when the user says "spin up my
  dev env", "start docker for <agent>", "bring up the tunnel", "/jetpack-dev-env", or when a
  feature is about to be tested in a browser. Args: <agent> (auto-detected from working
  directory) and optional sub-command (up | down | status; default up).
allowed-tools: Bash(jp docker:*), Bash(jp:*), Bash(jurassictube:*), Bash(docker:*), Bash(colima:*), Bash(curl:*), Bash(pgrep:*), Bash(printenv:*), Bash(cat:*), Bash(test:*), Bash(grep:*), Bash(nohup:*), Bash(sleep:*), Bash(date:*), Bash(basename:*), Bash(pwd:*), Bash(ls:*), Bash(git:*), Read
---

# Jetpack Dev Env (per-agent)

Stand up the local Docker WordPress env that the parallel-agent setup uses, plus the Jurassic Tube tunnel that gives it a public HTTPS URL. Idempotent — re-running `up` against a live env is a no-op except for the tunnel restart.

## Args

- **`<agent>`** — one of `atlas`, `nova`, `sage`, `echo`, `raven`.
  Auto-detect when omitted — works from anywhere inside the agent's clone:
  ```bash
  TOPLEVEL=$(git rev-parse --show-toplevel 2>/dev/null) \
    || { echo "Not inside a git repo. Pass <agent> explicitly or cd into your jetpack-<agent> clone."; exit 1; }

  # Canonical: read the agent name from the clone's identity file.
  AGENT=$(grep -m1 '^# Agent Identity:' "$TOPLEVEL/.claude/agent-identity.md" 2>/dev/null \
          | sed 's/^# Agent Identity: *//' | tr -d '[:space:]')
  # Fallback: derive from the toplevel directory name.
  [ -n "$AGENT" ] || AGENT=$(basename "$TOPLEVEL" | sed -n 's/^jetpack-//p')

  case "$AGENT" in
    atlas|nova|sage|echo|raven) ;;
    *) echo "Could not resolve agent name (got: '$AGENT'). Pass <agent> explicitly."; exit 1 ;;
  esac
  ```
  This works whether the skill is invoked from the clone root, `projects/plugins/jetpack/`, or any subdirectory.
- **sub-command** — `up` (default) | `down` | `status`.

## Port allocation (fixed)

| Agent  | WP    | phpMy | Mailpit UI | SMTP  | SFTP  | JT subdomain | Public URL                      |
|--------|-------|-------|------------|-------|-------|--------------|---------------------------------|
| atlas  | 18080 | 18281 | 11180      | 12525 | 11122 | `jp-atlas`   | https://jp-atlas.jurassic.tube/ |
| nova   | 18090 | 18291 | 11190      | 12535 | 11132 | `jp-nova`    | https://jp-nova.jurassic.tube/  |
| sage   | 18100 | 18301 | 11200      | 12545 | 11142 | `jp-sage`    | https://jp-sage.jurassic.tube/  |
| echo   | 18110 | 18311 | 11210      | 12555 | 11152 | `jp-echo`    | https://jp-echo.jurassic.tube/  |
| raven  | 18120 | 18321 | 11220      | 12565 | 11162 | `jp-raven`   | https://jp-raven.jurassic.tube/ |

**Port 8080 is reserved by AutoProxxy on Jasper's machine — never use it.**

WP admin creds on every env: `wordpress` / `imyourdaddy`. (`jp docker install` still creates the user with the default `wordpress` password — the skill rotates it via `wp user update` immediately after install. Account-protection module is also deactivated to avoid the leaked-password verification gate, since the default `wordpress` would otherwise trigger it on first login.)

## Caddy + Jurassic Tube split (read before touching DNS or /etc/hosts)

Jasper's local setup separates the local HTTPS path from the public-inbound path. They share a hostname, which is the part that confuses fresh eyes:

- **Local HTTPS** — `/etc/hosts` intentionally pins all five `jp-<agent>.jurassic.tube` subdomains to `127.0.0.1`. **Caddy** listens on 443 for those hostnames and reverse-proxies to the agent's docker WP port (atlas → :18080, nova → :18090, …). That's why `curl https://jp-atlas.jurassic.tube/` from the host returns 200 — it's going through Caddy, not the tunnel.
- **Public inbound (Jurassic Tube)** — the `jurassictube` `ssh -R` tunnel is **only** so the outside world (wpcom, Jetpack, webhooks) can reach the local blog from the public internet via the JT server. From the host machine you cannot reach the JT path because DNS is shadowed by `/etc/hosts` — that's expected, not broken.

**Do not** propose editing or commenting out the `/etc/hosts` entries. **Do not** treat `curl https://jp-<agent>.jurassic.tube/` returning 200 as proof the JT tunnel is healthy — that's a Caddy check. Verify the tunnel by process existence (`pgrep -af jurassictube`) and the "Connection established" line in `/tmp/jt-<agent>.log`.

## Pre-flight (`up` and `status`)

1. **Docker running** — Jasper uses Colima, not Docker Desktop. If `docker info` fails, start Colima and wait for it to come up before continuing:
   ```bash
   if ! docker info > /dev/null 2>&1; then
     command -v colima > /dev/null || { echo "Docker daemon is down and colima is not installed"; exit 1; }
     colima start
     for i in $(seq 1 60); do docker info > /dev/null 2>&1 && break; sleep 2; done
     docker info > /dev/null 2>&1 || { echo "colima started but docker still unresponsive"; exit 1; }
   fi
   ```
2. **`jp` CLI available**
   ```bash
   jp --help > /dev/null 2>&1 || { echo "jp CLI not on PATH — install @automattic/jetpack-cli globally"; exit 1; }
   ```
3. **Jurassic Tube CLI** (only required if you'll start the tunnel):
   ```bash
   command -v jurassictube > /dev/null || echo "Note: jurassictube not on PATH — tunnel step will be skipped"
   JT_USER=$(printenv JP_TUNNEL_USER || cat ~/.jp-tunnel-user 2>/dev/null)
   [ -n "$JT_USER" ] || echo "Note: JT username not set ($JP_TUNNEL_USER or ~/.jp-tunnel-user) — tunnel step will be skipped"
   ```

## `up` — bring up docker + tunnel

The parallel docker flags (`--name`, `--port-*`, `--clone-from`) are merged into trunk — `tools/cli/commands/docker.js` defines them on the default branch — so no branch swap is required. Resolve ports for `<agent>` from the table above and run from the agent's clone on whatever branch is currently checked out.

```bash
# 1. Start (or no-op) the docker stack.
#
#    --clone-from dev is ONLY for first-time setup. If the agent's MariaDB data
#    dir already has tables on disk, omit it — the bind-mount preserves data
#    across container recreation, and re-cloning is unnecessary churn (and
#    fails noisily when `jetpack_dev` happens not to be running).
CLONE_ARGS=""
if [ ! -d "$TOPLEVEL/tools/docker/data/jetpack_<agent>_mysql/mysql" ]; then
  CLONE_ARGS="--clone-from dev"
fi
jp docker up -d --name <agent> \
  --port <WP> --port-phpmy <PHPMY> \
  --port-inbox <MAIL_UI> --port-smtp <SMTP> --port-sftp <SFTP> \
  $CLONE_ARGS

# 2. Install Jetpack/WordPress in the env (no-op if data already populated)
jp docker install --name <agent> --port <WP>

# 3. Rotate the admin password off the default and disable Jetpack's account-protection
#    module. The default `wordpress` password is on the leaked-passwords list, which
#    triggers Account Protection's email verification gate on first login and blocks
#    automated browser testing. Idempotent — re-running just resets to the same value.
docker exec "jetpack_<agent>-wordpress-1" wp user update wordpress --user_pass='imyourdaddy' --allow-root
docker exec "jetpack_<agent>-wordpress-1" wp jetpack module deactivate account-protection --allow-root || true

# 4. Verify WP is reachable on localhost
curl -sI -o /dev/null -w "local: HTTP %{http_code}\n" "http://localhost:<WP>/"
```

If a tunnel is already running for `jp-<agent>` (`pgrep -f "jurassictube .* -s jp-<agent>"`), leave it alone. Otherwise, if `jurassictube` and `JT_USER` are both available:

```bash
nohup jurassictube -u "$JT_USER" -s jp-<agent> -h "localhost:<WP>" \
  > "/tmp/jt-<agent>.log" 2>&1 &
sleep 8
# Verify the JT process is alive (NOT by curling jp-<agent>.jurassic.tube — that
# hits Caddy locally, not the tunnel). The tunnel's job is inbound from outside.
pgrep -af "jurassictube .* -s jp-<agent>" || echo "tunnel: jurassictube process not found — see /tmp/jt-<agent>.log"
grep -E "Connection established|URL: https" "/tmp/jt-<agent>.log" | tail -2

# Local TLS reachability is a Caddy check (separate from the tunnel).
curl -sIk -o /dev/null -w "caddy: HTTP %{http_code}\n" "https://jp-<agent>.jurassic.tube/"
```

If the JT process didn't start, tail `/tmp/jt-<agent>.log`, summarize the error, and continue (the docker env is still usable on `localhost:<WP>` and `https://jp-<agent>.jurassic.tube/` via Caddy).

## `status`

Report each lane independently — the local Caddy path and the JT inbound tunnel are different things despite sharing a hostname:

- `jp docker status --name <agent>` — containers up/down.
- `pgrep -af "jurassictube .* -s jp-<agent>"` — JT tunnel pid (or "not running"). This is the only honest signal that external/inbound webhook traffic can reach the blog.
- `pgrep -af caddy` — Caddy running (handles local HTTPS).
- `curl -sI -o /dev/null -w "%{http_code}\n" http://localhost:<WP>/` — local HTTP via docker port mapping.
- `curl -sIk -o /dev/null -w "%{http_code}\n" https://jp-<agent>.jurassic.tube/` — local HTTPS via **Caddy** (DNS is pinned to 127.0.0.1 by `/etc/hosts`; this is **not** a tunnel reachability probe).

## `down`

```bash
# 1. Stop the JT tunnel (idempotent)
jurassictube -b -s jp-<agent> 2>/dev/null || true

# 2. Stop containers, keep data
jp docker stop --name <agent>
```

**Do NOT** run `jp docker clean --name <agent>` here — that wipes the DB. Run it only when the user explicitly asks for a fresh database.

## Output

Print these lines on success (orchestrator may grep them):

```
AGENT: <agent>
WP_LOCAL:     http://localhost:<WP>/
WP_LOCAL_TLS: https://jp-<agent>.jurassic.tube/   # via Caddy (local /etc/hosts → 127.0.0.1)
WP_PUBLIC:    https://jp-<agent>.jurassic.tube/   # via Jurassic Tube (inbound from wpcom/Jetpack); "tunnel: skipped" if no JT
WP_ADMIN_USER: wordpress
WP_ADMIN_PASS: imyourdaddy
PHPMY_PORT: <PHPMY>
MAIL_UI_PORT: <MAIL_UI>
ENV_STATUS: up | down | partial   # partial = docker up but jurassictube process failed to start
```

`ENV_STATUS: up` requires docker containers healthy AND the `jurassictube` process alive. Do **not** downgrade to `partial` because `curl https://jp-<agent>.jurassic.tube/` from the host doesn't match an external expectation — that probe goes through Caddy by design.

## Notes

- WP_HOME / WP_SITEURL are computed dynamically from `HTTP_HOST` in Jetpack's docker `wp-config.php`, so the same instance is reachable at `http://localhost:<WP>/`, the Caddy local-HTTPS path, and the JT inbound path without a database search-replace.
- The DB container is MariaDB 11.x — use the `mariadb` CLI, not `mysql`, when shelling in.
- After `up`, plugins from the monorepo are mounted as source. They activate fine without a build, **but require a build to function** — use the `jetpack-build-matrix` skill before browser-testing a feature.
