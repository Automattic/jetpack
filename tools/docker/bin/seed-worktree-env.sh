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
#   - idempotent (it only fills the keys that are missing; a no-op once fully configured), and
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

# Detect a *linked* worktree: its per-worktree git dir differs from the shared common dir. In
# the primary checkout the two are equal, so we leave it as the default jetpack_dev instance.
# `--absolute-git-dir` resolves symlinks, so resolve the common dir with `pwd -P` too — otherwise
# reaching the primary through a symlinked path makes the two differ and the primary gets seeded.
GIT_ABS_DIR="$( git rev-parse --absolute-git-dir 2>/dev/null || true )"
GIT_COMMON_DIR="$( cd "$( git rev-parse --git-common-dir 2>/dev/null || echo . )" 2>/dev/null && pwd -P || true )"
if [ -z "$GIT_ABS_DIR" ] || [ "$GIT_ABS_DIR" = "$GIT_COMMON_DIR" ]; then
	echo "Not a linked git worktree — leaving tools/docker/.env as the primary jetpack_dev instance."
	exit 0
fi

touch "$ENV_FILE"

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

# Sanitize a raw name to the Compose project-name charset. Result is empty or starts with [a-z0-9].
slugify() {
	printf '%s' "$1" | tr '[:upper:]' '[:lower:]' \
		| sed -E 's/[^a-z0-9_-]+/-/g; s/-+/-/g; s/^[-_]+//; s/[-_]+$//'
}

# Stable short hash of a string (used to disambiguate colliding/reserved slugs).
hash_of() {
	printf '%s' "$1" | cksum | cut -d' ' -f1
}

# Decide the port for key $1: reuse this worktree's existing numeric value (e.g. from a prior
# `jp docker up --port …`), else allocate a fresh one at/above base $2. Sets ALLOCATED and
# NEED_WRITE (1 = must be written to .env, 0 = a valid value is already there). A reused value
# is normalized (base-10, so `08080` matches `8080`) and reserved in CLAIMED.
assign_port() {
	local existing
	existing="$( env_value "$1" )"
	case "$existing" in
		'' | *[!0-9]* )
			alloc_port "$2"
			NEED_WRITE=1
			;;
		* )
			existing="$(( 10#$existing ))"
			ALLOCATED="$existing"
			is_claimed "$existing" || CLAIMED="${CLAIMED}${existing} "
			NEED_WRITE=0
			;;
	esac
}

# --- gather claimed ports and names from every worktree --------------------

# Capture the worktree list first so a git failure is visible to set -e (a process
# substitution would swallow its exit status, silently skipping collision avoidance).
WORKTREES="$( git worktree list --porcelain )"

# Seed with the primary instance's default host ports (it runs off default.env, not a managed
# .env, so it never shows up in the scan below). CLAIMED_NAMES tracks project names already
# written by hand into a sibling .env.
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
							* )
								val="$(( 10#$val ))"  # normalize so `08080` matches `8080`
								is_claimed "$val" || CLAIMED="${CLAIMED}${val} "
								;;
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

# --- resolve the project name ----------------------------------------------

# Keep an existing COMPOSE_PROJECT_NAME untouched (respect `up --name`, hand edits, or a prior
# run); only derive and write a slug when none is set yet.
if grep -qE '^[[:space:]]*(export[[:space:]]+)?COMPOSE_PROJECT_NAME[[:space:]]*=' "$ENV_FILE"; then
	NAME_PRESENT=1
	INSTANCE="$( env_value COMPOSE_PROJECT_NAME )"
else
	NAME_PRESENT=0
	RAW_NAME="$( basename "$GIT_ABS_DIR" )"
	SLUG="$( slugify "$RAW_NAME" )"
	case "$SLUG" in
		'' | dev | e2e )
			SLUG="wt-$( hash_of "$GIT_ABS_DIR" )"
			;;
		* )
			# Sanitization is many-to-one (`a.b` and `a-b` both slug to `a-b`). Enumerating the
			# worktree git dirs — which all exist regardless of whether a sibling has seeded its
			# .env yet — catches a colliding sibling even in the race where neither has seeded.
			# A sibling that already claimed the name by hand is caught via CLAIMED_NAMES.
			need_hash=0
			for d in "$GIT_COMMON_DIR"/worktrees/*/; do
				[ -d "$d" ] || continue
				other="$( basename "$d" )"
				if [ "$other" != "$RAW_NAME" ] && [ "$( slugify "$other" )" = "$SLUG" ]; then
					need_hash=1
				fi
			done
			case "$CLAIMED_NAMES" in
				*" jetpack_${SLUG} "* ) need_hash=1 ;;
			esac
			if [ "$need_hash" = 1 ]; then
				SLUG="${SLUG}-$( hash_of "$GIT_ABS_DIR" )"
			fi
			;;
	esac
	INSTANCE="jetpack_${SLUG}"
fi

# --- choose ports ----------------------------------------------------------

assign_port PORT_WORDPRESS 8080; PORT_WORDPRESS="$ALLOCATED"; W_WORDPRESS="$NEED_WRITE"
assign_port PORT_PHPMY     8282; PORT_PHPMY="$ALLOCATED";     W_PHPMY="$NEED_WRITE"
assign_port PORT_INBOX     1180; PORT_INBOX="$ALLOCATED";     W_INBOX="$NEED_WRITE"
assign_port PORT_SMTP      2525; PORT_SMTP="$ALLOCATED";      W_SMTP="$NEED_WRITE"
assign_port PORT_SFTP      2222; PORT_SFTP="$ALLOCATED";      W_SFTP="$NEED_WRITE"

# --- write only the missing keys -------------------------------------------

# Build the block first so we can tell whether there's anything to add. COMPOSE_PROJECT_NAME goes
# LAST so an interrupted append never leaves a name without its ports.
BLOCK=""
add_kv() { BLOCK="${BLOCK}$1=$2
"; }
if [ "$W_WORDPRESS" = 1 ]; then add_kv PORT_WORDPRESS "$PORT_WORDPRESS"; fi
if [ "$W_PHPMY" = 1 ];     then add_kv PORT_PHPMY "$PORT_PHPMY"; fi
if [ "$W_INBOX" = 1 ];     then add_kv PORT_INBOX "$PORT_INBOX"; fi
if [ "$W_SMTP" = 1 ];      then add_kv PORT_SMTP "$PORT_SMTP"; fi
if [ "$W_SFTP" = 1 ];      then add_kv PORT_SFTP "$PORT_SFTP"; fi
if [ "$NAME_PRESENT" = 0 ]; then add_kv COMPOSE_PROJECT_NAME "jetpack_${SLUG}"; fi

if [ -z "$BLOCK" ]; then
	echo "tools/docker/.env already fully configured for '${INSTANCE}' — nothing to add."
	grep -E '^[[:space:]]*(export[[:space:]]+)?(COMPOSE_PROJECT_NAME|PORT_)' "$ENV_FILE" | sed 's/^/  /'
	exit 0
fi

{
	echo ""
	echo "# Parallel-instance config (seeded by tools/docker/bin/seed-worktree-env.sh)."
	echo "# Edit by hand at any time; delete these lines to fall back to the primary jetpack_dev instance."
	printf '%s' "$BLOCK"
} >> "$ENV_FILE"

echo "Seeded tools/docker/.env for this worktree:"
echo "  instance:   ${INSTANCE}"
echo "  WordPress:  http://localhost:${PORT_WORDPRESS}/"
echo "  phpMyAdmin: ${PORT_PHPMY}   inbox: ${PORT_INBOX}   SMTP: ${PORT_SMTP}   SFTP: ${PORT_SFTP}"
echo "Run \`jp docker up -d\` to start it."
