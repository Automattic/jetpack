#!/usr/bin/env bash

# seed-worktree-env.sh — give this git worktree its own isolated Jetpack Docker instance.
#
# `jp docker up` reads COMPOSE_PROJECT_NAME and PORT_* from tools/docker/.env and, when they
# are absent, falls back to the shared `jetpack_dev` instance on the default ports. Run from a
# linked git worktree, several checkouts therefore collide: they share one set of containers
# and the bind-mounts get re-pointed at whichever worktree ran `up` last.
#
# This script seeds the worktree's tools/docker/.env with a unique project name (derived from
# the worktree directory) plus a free set of host ports that avoid the primary instance and
# every other worktree. After running it once, a bare `jp docker up -d` brings up an isolated
# instance for this worktree. It is:
#   - host-only (run it on your machine, not inside the container),
#   - idempotent (a no-op once COMPOSE_PROJECT_NAME is present), and
#   - a no-op in the primary checkout, which keeps using `jetpack_dev`.
#
# Written for portability down to the bash 3.2 that ships with macOS — no associative arrays.
#
# Usage:  tools/docker/bin/seed-worktree-env.sh

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOCKER_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
ENV_FILE="$DOCKER_DIR/.env"

# Anchor git lookups to this worktree (the one that owns this script), not the caller's cwd.
cd "$DOCKER_DIR"

# Detect a *linked* worktree: its per-worktree git dir differs from the shared common dir.
# In the primary checkout the two are equal, so we leave it as the default jetpack_dev instance.
GIT_ABS_DIR="$( git rev-parse --absolute-git-dir 2>/dev/null || true )"
GIT_COMMON_DIR="$( cd "$( git rev-parse --git-common-dir 2>/dev/null || echo . )" 2>/dev/null && pwd || true )"
if [ -z "$GIT_ABS_DIR" ] || [ "$GIT_ABS_DIR" = "$GIT_COMMON_DIR" ]; then
	echo "Not a linked git worktree — leaving tools/docker/.env as the primary jetpack_dev instance."
	exit 0
fi

touch "$ENV_FILE"

# Idempotent: if a project name is already set (by us or by hand), don't touch anything.
if grep -qE '^[[:space:]]*COMPOSE_PROJECT_NAME[[:space:]]*=' "$ENV_FILE"; then
	echo "tools/docker/.env already defines COMPOSE_PROJECT_NAME — leaving it unchanged."
	grep -E '^[[:space:]]*(COMPOSE_PROJECT_NAME|PORT_)' "$ENV_FILE" | sed 's/^/  /'
	exit 0
fi

# Slug from the worktree's git-dir basename (e.g. .git/worktrees/<name>), sanitized to the
# Compose project-name charset. Fall back to a stable hash when the name is empty or reserved.
RAW_NAME="$( basename "$GIT_ABS_DIR" )"
SLUG="$( printf '%s' "$RAW_NAME" | tr '[:upper:]' '[:lower:]' \
	| sed -E 's/[^a-z0-9_-]+/-/g; s/-+/-/g; s/^[-_]+//; s/[-_]+$//' )"
case "$SLUG" in
	'' | dev | e2e | [!a-z0-9]* )
		SLUG="wt-$( printf '%s' "$GIT_ABS_DIR" | cksum | cut -d' ' -f1 )"
		;;
esac

# Track claimed host ports as a space-delimited string (bash 3.2 has no associative arrays):
# the primary instance's defaults plus every port any worktree has persisted in its own .env.
CLAIMED=" 80 8181 1080 25 1022 "

is_claimed() {
	case "$CLAIMED" in
		*" $1 "* ) return 0 ;;
		* ) return 1 ;;
	esac
}

while IFS= read -r line; do
	case "$line" in
		"worktree "* )
			sibling="${line#worktree }/tools/docker/.env"
			[ -f "$sibling" ] || continue
			while IFS= read -r kv; do
				case "$kv" in
					PORT_*=* )
						val="${kv#*=}"
						val="$( printf '%s' "$val" | tr -d '[:space:]' )"
						case "$val" in
							'' | *[!0-9]* ) ;;  # not a plain number — skip
							* ) is_claimed "$val" || CLAIMED="${CLAIMED}${val} " ;;
						esac
						;;
				esac
			done < "$sibling"
			;;
	esac
done < <( git worktree list --porcelain )

# Return the first free port at or above the given base, reserving it so the five services
# never land on the same number.
alloc_port() {
	local port="$1"
	while is_claimed "$port"; do
		port=$(( port + 1 ))
	done
	CLAIMED="${CLAIMED}${port} "
	printf '%s' "$port"
}

PORT_WORDPRESS="$( alloc_port 8080 )"
PORT_PHPMY="$( alloc_port 8282 )"
PORT_INBOX="$( alloc_port 1180 )"
PORT_SMTP="$( alloc_port 2525 )"
PORT_SFTP="$( alloc_port 2222 )"

cat >> "$ENV_FILE" <<EOF

# Parallel-instance config (seeded by tools/docker/bin/seed-worktree-env.sh).
# Edit by hand at any time; delete these lines to fall back to the primary jetpack_dev instance.
COMPOSE_PROJECT_NAME=jetpack_${SLUG}
PORT_WORDPRESS=${PORT_WORDPRESS}
PORT_PHPMY=${PORT_PHPMY}
PORT_INBOX=${PORT_INBOX}
PORT_SMTP=${PORT_SMTP}
PORT_SFTP=${PORT_SFTP}
EOF

echo "Seeded tools/docker/.env for this worktree:"
echo "  instance:   jetpack_${SLUG}"
echo "  WordPress:  http://localhost:${PORT_WORDPRESS}/"
echo "  phpMyAdmin: ${PORT_PHPMY}   inbox: ${PORT_INBOX}   SMTP: ${PORT_SMTP}   SFTP: ${PORT_SFTP}"
echo "Run \`jp docker up -d\` to start it."
