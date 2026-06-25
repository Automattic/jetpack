#!/usr/bin/env bash

# seed-worktree-env.sh — give this git worktree its own isolated Jetpack Docker instance.
#
# `jp docker up` reads COMPOSE_PROJECT_NAME and PORT_* from tools/docker/.env and, when they
# are absent, falls back to the shared `jetpack_dev` instance on the default ports. Run from a
# linked git worktree, several checkouts therefore collide: they share one set of containers
# and the bind-mounts get re-pointed at whichever worktree ran `up` last.
#
# This script seeds the worktree's tools/docker/.env with a unique project name (derived from
# the worktree's name) plus a free set of host ports that avoid the primary instance and every
# other worktree. After running it once, a bare `jp docker up -d` brings up an isolated instance
# for this worktree. It is:
#   - host-only (run it on your machine, not inside the container),
#   - idempotent (a no-op once COMPOSE_PROJECT_NAME is present), and
#   - a no-op in the primary checkout, which keeps using `jetpack_dev`.
#
# Known limitations (acceptable for a manual dev helper): it reserves ports recorded in other
# worktrees' .env files and the primary defaults, but does NOT probe for live-bound host ports,
# and does not lock against another worktree seeding at the same instant. A genuine clash
# surfaces as a `jp docker up` "address already in use" error; re-run after editing .env.
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

# Idempotent: if a project name is already set (by us or by hand), don't touch anything. The
# `(export )?` prefix matches the same dotenv shapes env_value() and the sibling scan tolerate.
if grep -qE '^[[:space:]]*(export[[:space:]]+)?COMPOSE_PROJECT_NAME[[:space:]]*=' "$ENV_FILE"; then
	echo "tools/docker/.env already defines COMPOSE_PROJECT_NAME — leaving it unchanged."
	grep -E '^[[:space:]]*(export[[:space:]]+)?(COMPOSE_PROJECT_NAME|PORT_)' "$ENV_FILE" | sed 's/^/  /'
	exit 0
fi

# --- helpers ---------------------------------------------------------------

# Is this host port already spoken for? CLAIMED is a space-delimited string because bash 3.2
# has no associative arrays.
is_claimed() {
	case "$CLAIMED" in
		*" $1 "* ) return 0 ;;
		* ) return 1 ;;
	esac
}

# Reserve the first free port at or above $1 into CLAIMED and return it via ALLOCATED. Writing
# to a global (rather than echoing via command substitution, which runs in a subshell and would
# discard the CLAIMED reservation) keeps the five services from ever landing on the same number.
ALLOCATED=""
alloc_port() {
	local port="$1"
	while is_claimed "$port"; do
		port=$(( port + 1 ))
	done
	CLAIMED="${CLAIMED}${port} "
	ALLOCATED="$port"
}

# Normalize a raw .env value the way a dotenv parser would: drop an inline ` # comment`, trim
# surrounding whitespace, and strip one layer of surrounding single or double quotes.
clean_scalar() {
	printf '%s' "$1" | sed -E "s/[[:space:]]+#.*\$//; s/^[[:space:]]+//; s/[[:space:]]+\$//; s/^\"(.*)\"\$/\\1/; s/^'(.*)'\$/\\1/"
}

# Echo the current value of key $1 in $ENV_FILE (last assignment wins, matching dotenv), or
# nothing when the key is absent. Tolerates a leading `export ` / indentation. `|| true` keeps a
# no-match grep (non-zero under pipefail) from aborting the script when captured in an assignment.
env_value() {
	local raw
	raw="$( { grep -E "^[[:space:]]*(export[[:space:]]+)?$1[[:space:]]*=" "$ENV_FILE" | tail -n1 \
		| sed -E "s/^[[:space:]]*(export[[:space:]]+)?$1[[:space:]]*=//"; } || true )"
	clean_scalar "$raw"
}

# Reuse this worktree's existing PORT_* value when one is already present (e.g. left by a prior
# `jp docker up --port …`), otherwise allocate a fresh one. Sets ALLOCATED either way, and
# reserves a reused value in CLAIMED so a later service can't pick the same number.
assign_port() {
	local existing
	existing="$( env_value "$1" )"
	case "$existing" in
		'' | *[!0-9]* ) alloc_port "$2" ;;
		* ) ALLOCATED="$existing"; is_claimed "$existing" || CLAIMED="${CLAIMED}${existing} " ;;
	esac
}

# --- gather claimed ports and names from every worktree --------------------

# Capture the worktree list first so a git failure is visible to set -e (a process
# substitution would swallow its exit status, silently skipping collision avoidance).
WORKTREES="$( git worktree list --porcelain )"

# Seed with the primary instance's default host ports (it runs off default.env, not a managed
# .env, so it never shows up in the scan below). CLAIMED_NAMES tracks project names so a slug
# that another worktree already uses gets disambiguated.
CLAIMED=" 80 8181 1080 25 1022 "
CLAIMED_NAMES=" "

while IFS= read -r line; do
	case "$line" in
		"worktree "* )
			# `-r` (not `-f`): an existing-but-unreadable sibling should be skipped, not abort.
			sibling="${line#worktree }/tools/docker/.env"
			[ -r "$sibling" ] || continue
			# `|| [ -n "$kv" ]` so a final line with no trailing newline is still processed —
			# otherwise that sibling's last PORT_ would be missed and could be re-allocated.
			while IFS= read -r kv || [ -n "$kv" ]; do
				# Tolerate indentation and an optional `export ` so the keys still match.
				kv="${kv#"${kv%%[![:space:]]*}"}"
				kv="${kv#export }"
				case "$kv" in
					PORT_*=* )
						val="$( clean_scalar "${kv#*=}" )"
						case "$val" in
							'' | *[!0-9]* ) ;;  # not a plain number — skip
							* ) is_claimed "$val" || CLAIMED="${CLAIMED}${val} " ;;
						esac
						;;
					COMPOSE_PROJECT_NAME=* )
						nm="$( clean_scalar "${kv#*=}" )"
						[ -n "$nm" ] && CLAIMED_NAMES="${CLAIMED_NAMES}${nm} "
						;;
				esac
			done < "$sibling"
			;;
	esac
done <<< "$WORKTREES"

# --- derive a unique slug --------------------------------------------------

# Slug from the worktree's git-dir basename (e.g. .git/worktrees/<name>), sanitized to the
# Compose project-name charset. The sed pipeline guarantees the result is empty or starts with
# [a-z0-9], so only the empty/reserved cases need the hashed fallback.
RAW_NAME="$( basename "$GIT_ABS_DIR" )"
SLUG="$( printf '%s' "$RAW_NAME" | tr '[:upper:]' '[:lower:]' \
	| sed -E 's/[^a-z0-9_-]+/-/g; s/-+/-/g; s/^[-_]+//; s/[-_]+$//' )"
case "$SLUG" in
	'' | dev | e2e )
		SLUG="wt-$( printf '%s' "$GIT_ABS_DIR" | cksum | cut -d' ' -f1 )"
		;;
esac
# Sanitization is many-to-one (e.g. `a.b` and `a-b` both slug to `a-b`); if another worktree
# already claimed this project name, disambiguate with a hash of the unique git-dir path.
case "$CLAIMED_NAMES" in
	*" jetpack_${SLUG} "* )
		SLUG="${SLUG}-$( printf '%s' "$GIT_ABS_DIR" | cksum | cut -d' ' -f1 )"
		;;
esac

# --- choose ports and write only the keys that are missing -----------------

assign_port PORT_WORDPRESS 8080; PORT_WORDPRESS="$ALLOCATED"
assign_port PORT_PHPMY     8282; PORT_PHPMY="$ALLOCATED"
assign_port PORT_INBOX     1180; PORT_INBOX="$ALLOCATED"
assign_port PORT_SMTP      2525; PORT_SMTP="$ALLOCATED"
assign_port PORT_SFTP      2222; PORT_SFTP="$ALLOCATED"

# Append only the keys not already in .env (so a stray PORT_* left by a prior `up --port …` is
# preserved, not duplicated), and write COMPOSE_PROJECT_NAME LAST: if the append is interrupted
# mid-write, the idempotency guard above won't trip on a half-written config.
{
	echo ""
	echo "# Parallel-instance config (seeded by tools/docker/bin/seed-worktree-env.sh)."
	echo "# Edit by hand at any time; delete these lines to fall back to the primary jetpack_dev instance."
	[ -n "$( env_value PORT_WORDPRESS )" ] || echo "PORT_WORDPRESS=${PORT_WORDPRESS}"
	[ -n "$( env_value PORT_PHPMY )" ]     || echo "PORT_PHPMY=${PORT_PHPMY}"
	[ -n "$( env_value PORT_INBOX )" ]     || echo "PORT_INBOX=${PORT_INBOX}"
	[ -n "$( env_value PORT_SMTP )" ]      || echo "PORT_SMTP=${PORT_SMTP}"
	[ -n "$( env_value PORT_SFTP )" ]      || echo "PORT_SFTP=${PORT_SFTP}"
	echo "COMPOSE_PROJECT_NAME=jetpack_${SLUG}"
} >> "$ENV_FILE"

echo "Seeded tools/docker/.env for this worktree:"
echo "  instance:   jetpack_${SLUG}"
echo "  WordPress:  http://localhost:${PORT_WORDPRESS}/"
echo "  phpMyAdmin: ${PORT_PHPMY}   inbox: ${PORT_INBOX}   SMTP: ${PORT_SMTP}   SFTP: ${PORT_SFTP}"
echo "Run \`jp docker up -d\` to start it."
