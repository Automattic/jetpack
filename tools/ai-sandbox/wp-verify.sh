#!/usr/bin/env bash
# Manage the wp-verify WordPress stack for premium-analytics UI verification.
#
# Usage (from anywhere inside the jetpack repo, or from inside jetpack-ai-sandbox):
#   tools/ai-sandbox/wp-verify.sh up    # start WordPress stack + sandbox with Docker socket
#   tools/ai-sandbox/wp-verify.sh down  # stop everything
#
# Parallel-isolation: set WP_VERIFY_INSTANCE=<id> in the environment to run a
# second (or third) wp-verify stack alongside an existing one on the same host.
# Container names, the Compose project, volumes, and networks all gain a
# matching `-<id>` suffix so two stacks do not collide. Default (env unset)
# preserves the historical names (`jetpack-ai-sandbox`, `jetpack-ai-mysql`,
# etc.) so existing single-stack flows are unaffected.
#
# WP_VERIFY_INSTANCE must match `[a-z0-9][a-z0-9_-]*` (lowercase alphanumeric
# plus `-` and `_`, starting with alphanumeric) — Docker compose project names
# reject other characters and would otherwise surface as cryptic compose errors.
#
# In-sandbox semantics: when invoked from inside a sandbox container, the
# script reconciles WP_VERIFY_INSTANCE with the current container's own
# instance (read from its `com.docker.compose.project` label) — it can only
# correctly manage the stack the current container belongs to. An explicit
# WP_VERIFY_INSTANCE that differs from the current container's value is a
# fatal error (exit code 1). New instances must be started from the host,
# where the script is free to start a fresh jetpack-ai sandbox container too.
#
# Worktree mode (filesystem isolation for parallel agents): when invoked from
# a git worktree — the typical pattern for true multi-agent parallelism on one
# host — `wp-verify.sh` auto-detects the worktree state, computes the main
# repo's `.git/` host path via `git rev-parse --git-common-dir`, and includes
# `docker-compose.worktree.yml` to bind-mount it at the same absolute path
# inside the sandbox. Without this, the worktree's `.git` file (whose content
# is an absolute host path like `gitdir: /Users/foo/jetpack/.git/worktrees/<n>`)
# would not resolve inside the container and every `git` call in the sandbox
# would fail. Combined with WP_VERIFY_INSTANCE, the pair gives full
# parallel-agent capacity: each agent in its own worktree + its own stack.
#
# Recommended parallel-agent pattern (manually orchestrated):
#
#   git worktree add ../jetpack-task-foo fork/some-branch
#   cd ../jetpack-task-foo
#   WP_VERIFY_INSTANCE=task-foo bash tools/ai-sandbox/wp-verify.sh up
#   docker exec -it jetpack-ai-sandbox-task-foo bash    # work in here
#
# Repeat with task-bar in a second terminal. The pair (worktree + INSTANCE)
# gives full container/network/volume/filesystem isolation. The script does
# not create worktrees automatically — callers control where, off which
# branch, and how to clean up.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Optional per-instance suffix for parallel runs. Empty (default) preserves
# historical names; set to a short token (e.g. an issue ID) for isolation.
EXPLICIT_INSTANCE="${WP_VERIFY_INSTANCE:-}"
if [ -n "$EXPLICIT_INSTANCE" ] && ! printf '%s' "$EXPLICIT_INSTANCE" | grep -qE '^[a-z0-9][a-z0-9_-]*$'; then
  echo "Error: WP_VERIFY_INSTANCE='$EXPLICIT_INSTANCE' is invalid." >&2
  echo "       Must match [a-z0-9][a-z0-9_-]* (lowercase alphanumeric plus '-' and '_', starting alphanumeric)." >&2
  exit 1
fi

# Reconcile the user-supplied instance with the current container's instance.
# When invoked from inside a sandbox, the only stack this script can correctly
# manage is the one the current container belongs to — Compose interpolation
# does not propagate WP_VERIFY_INSTANCE into the container automatically, so
# without this reconciliation an in-sandbox `down` from `jetpack-ai-sandbox-foo`
# would default to managing the *unsuffixed* `ai-sandbox` project, stopping
# the wrong stack.
if [ -f /.dockerenv ]; then
  # wp-verify.sh needs the host Docker socket to orchestrate WP services from
  # inside the sandbox and to discover the current container's compose project
  # label below. Validate the socket up front so callers see an actionable
  # error instead of a downstream "could not read compose project label..."
  # which is a symptom, not the cause.
  if [ ! -S /var/run/docker.sock ] || ! docker info >/dev/null 2>&1; then
    echo "Error: Docker socket at /var/run/docker.sock is missing or not usable from inside this container." >&2
    echo "       wp-verify.sh needs it to manage the WP stack from the sandbox." >&2
    echo "       Either re-run from the host, or ensure the sandbox was started with docker-compose.wp-verify.yml's socket mount active." >&2
    exit 1
  fi
  CURRENT_PROJECT=$(docker inspect "$HOSTNAME" \
    --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>/dev/null || true)
  if [ -z "$CURRENT_PROJECT" ]; then
    echo "Error: could not read compose project label from current container ($HOSTNAME)." >&2
    echo "       The sandbox container must have been started via 'wp-verify.sh up' (which sets it)." >&2
    exit 1
  fi
  case "$CURRENT_PROJECT" in
    ai-sandbox)         DETECTED_INSTANCE="" ;;
    ai-sandbox-*)       DETECTED_INSTANCE="${CURRENT_PROJECT#ai-sandbox-}" ;;
    *)
      echo "Error: current container's compose project '$CURRENT_PROJECT' does not look like ai-sandbox[-suffix]." >&2
      exit 1
      ;;
  esac
  if [ -n "$EXPLICIT_INSTANCE" ] && [ "$EXPLICIT_INSTANCE" != "$DETECTED_INSTANCE" ]; then
    echo "Error: requested WP_VERIFY_INSTANCE='$EXPLICIT_INSTANCE' differs from the current container's instance '${DETECTED_INSTANCE:-<default>}'." >&2
    echo "       From inside a sandbox container, this script can only manage that container's own stack." >&2
    echo "       To manage a different instance, exit and re-run from the host." >&2
    exit 1
  fi
  INSTANCE="$DETECTED_INSTANCE"
else
  INSTANCE="$EXPLICIT_INSTANCE"
fi
SUFFIX="${INSTANCE:+-${INSTANCE}}"

# Container names — kept in sync with `${WP_VERIFY_INSTANCE:+-${WP_VERIFY_INSTANCE}}`
# interpolations in docker-compose.yml.
SANDBOX_NAME="jetpack-ai-sandbox${SUFFIX}"
MYSQL_NAME="jetpack-ai-mysql${SUFFIX}"
WORDPRESS_NAME="jetpack-ai-wordpress${SUFFIX}"
WPCLI_NAME="jetpack-ai-wpcli${SUFFIX}"

# Compose project name — namespaces networks + named volumes per instance.
# Default ("ai-sandbox") matches the historical name auto-derived from
# `--project-directory "$SCRIPT_DIR"` when no instance is set.
PROJECT_NAME="ai-sandbox${SUFFIX}"

# Export so docker compose can interpolate ${WP_VERIFY_INSTANCE} inside YAML.
# Use the reconciled INSTANCE so YAML interpolation matches the authoritative
# value (relevant when running from inside a sandbox without an explicit env).
export WP_VERIFY_INSTANCE="$INSTANCE"

# Detect JETPACK_HOST_PATH — the jetpack root on the HOST filesystem.
# Docker bind mounts are resolved by the host daemon, so we must pass the host path
# even when running this script from inside the sandbox container.
if [ -f /.dockerenv ]; then
  # Inside sandbox: inspect the *current* container (via $HOSTNAME = container's
  # short ID) rather than the suffixed name we'd build — this works regardless
  # of whether WP_VERIFY_INSTANCE matches the current container's instance, and
  # makes "extend WP services for the current instance" the supported in-sandbox
  # flow. Starting a *new* (different-instance) stack from inside is blocked
  # below; from-host invocation is the supported way to create new instances.
  JETPACK_HOST_PATH=$(docker inspect "$HOSTNAME" \
    --format '{{range .Mounts}}{{if eq .Destination "/home/dev/jetpack"}}{{.Source}}{{end}}{{end}}' 2>/dev/null || true)
  if [ -z "$JETPACK_HOST_PATH" ]; then
    echo "Error: could not detect host jetpack path from current container ($HOSTNAME)." >&2
    echo "       Is /home/dev/jetpack mounted from the host?" >&2
    exit 1
  fi
else
  # On host: resolve relative to this script's location (tools/ai-sandbox → repo root).
  JETPACK_HOST_PATH="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
export JETPACK_HOST_PATH

# Detect worktree mode — the worktree's .git file holds an absolute host path
# pointer to the main repo's .git/worktrees/<name>/ which the sandbox can't
# resolve without an extra mount at the same absolute path.
#
# `git rev-parse --git-common-dir` returns the path of the main `.git/`:
#   - main repo: usually ".git" (relative) or an absolute path equal to
#     "$JETPACK_HOST_PATH/.git"
#   - worktree:  always an absolute path to the *main* repo's .git/
#
# Skip detection inside the sandbox container — `git` isn't reliably on PATH
# in every variant of the sandbox image and the worktree's .git pointer is
# host-absolute anyway, so the host invocation is the only place this can be
# computed correctly.
WORKTREE_COMPOSE_OVERRIDE=()
if [ ! -f /.dockerenv ]; then
  GIT_COMMON_DIR_RAW=$(git -C "$JETPACK_HOST_PATH" rev-parse --git-common-dir 2>/dev/null || true)
  if [ -n "$GIT_COMMON_DIR_RAW" ]; then
    GIT_COMMON_DIR_HOST=$(cd "$JETPACK_HOST_PATH" && cd "$GIT_COMMON_DIR_RAW" && pwd)
    if [ "$GIT_COMMON_DIR_HOST" != "$JETPACK_HOST_PATH/.git" ]; then
      # Worktree — common dir lives elsewhere on the host.
      export JETPACK_GIT_COMMON_DIR_HOST="$GIT_COMMON_DIR_HOST"
      WORKTREE_COMPOSE_OVERRIDE=(-f "$SCRIPT_DIR/docker-compose.worktree.yml")
      echo "Worktree detected: main .git at $GIT_COMMON_DIR_HOST will be co-mounted into the sandbox."
    fi
  fi
fi

COMPOSE=(
  docker compose
  -f "$SCRIPT_DIR/docker-compose.yml"
  -f "$SCRIPT_DIR/docker-compose.wp-verify.yml"
  "${WORKTREE_COMPOSE_OVERRIDE[@]}"
  --project-directory "$SCRIPT_DIR"
  -p "$PROJECT_NAME"
)

case "${1:-up}" in
  up)
    echo "JETPACK_HOST_PATH=$JETPACK_HOST_PATH"
    if [ -f /.dockerenv ]; then
      # Inside sandbox: jetpack-ai is already running (this container); only
      # bring up the WP services. The reconciliation above guarantees INSTANCE
      # matches the current container's instance, so the WP services land in
      # the correct compose project.
      "${COMPOSE[@]}" --profile wp-verify up -d mysql wordpress wpcli
    else
      "${COMPOSE[@]}" --profile wp-verify up -d mysql wordpress wpcli jetpack-ai
    fi
    echo "WordPress stack started${INSTANCE:+ (instance: $INSTANCE)}."
    echo ""
    if [ -f /.dockerenv ]; then
      # Inside the sandbox container: localhost:${WP_VERIFY_HOST_PORT:-18080} is the
      # container's own loopback, not the host's published port, so the
      # host-side instructions would be misleading. Only print the sandbox-
      # reachable hostname + sandbox-side invocation here.
      echo "Access from inside this sandbox: http://wordpress"
      echo ""
      echo "Wait for wpcli setup, then run:"
      echo "  docker logs -f $WPCLI_NAME   # ready when you see: sleep infinity"
      echo ""
      echo "Sandbox-side verify (in this shell):"
      echo "  NODE_PATH=\$(npm root -g) playwright test --config tools/ai-sandbox/wp-verify/playwright.config.ts"
    else
      # On the host: both access paths are reachable depending on where the
      # caller runs Playwright. Print both with their respective invocations.
      echo "Host access:    http://localhost:${WP_VERIFY_HOST_PORT:-18080}/  (WordPress, published from container)"
      echo "Sandbox access: http://wordpress  (docker-network hostname; only resolvable from inside jetpack-ai-sandbox)"
      echo ""
      echo "Wait for wpcli setup, then run:"
      echo "  docker logs -f $WPCLI_NAME   # ready when you see: sleep infinity"
      echo ""
      echo "Sandbox-side verify:"
      echo "  docker exec -it $SANDBOX_NAME bash"
      echo "  NODE_PATH=\$(npm root -g) playwright test --config tools/ai-sandbox/wp-verify/playwright.config.ts"
      echo ""
      echo "Host-side verify (from this terminal):"
      echo "  WP_BASE=http://localhost:${WP_VERIFY_HOST_PORT:-18080} NODE_PATH=\$(npm root -g) playwright test --config tools/ai-sandbox/wp-verify/playwright.config.ts"
    fi
    ;;
  down)
    if [ -f /.dockerenv ]; then
      # Inside sandbox: only stop WP services; stopping jetpack-ai would kill this session.
      "${COMPOSE[@]}" --profile wp-verify stop mysql wordpress wpcli
      "${COMPOSE[@]}" --profile wp-verify rm -f mysql wordpress wpcli
    else
      "${COMPOSE[@]}" --profile wp-verify down
    fi
    ;;
  *)
    echo "Usage: $0 [up|down]" >&2
    exit 1
    ;;
esac
