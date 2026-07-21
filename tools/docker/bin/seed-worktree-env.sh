#!/usr/bin/env bash

# seed-worktree-env.sh — give this git worktree its own isolated Jetpack Docker instance.
#
# `jp docker up` reads COMPOSE_PROJECT_NAME and PORT_* from tools/docker/.env and, when they
# are absent, falls back to the shared `jetpack_dev` instance on the default ports. Run from a
# linked git worktree, several checkouts therefore collide: they share one set of containers
# and the bind-mounts get re-pointed at whichever worktree ran `up` last.
#
# This script seeds the worktree's tools/docker/.env with a unique project name (derived from git's
# worktree id — fixed when the worktree was created, not the current folder name) plus a free set of
# host ports that avoid the primary instance and every other worktree. After running it once, a bare
# `jp docker up -d` brings up an isolated instance for this worktree. It is:
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

# tools/docker/.env is read by two code paths that must agree: the global `jp docker up/down/stop/
# clean` host wrapper parses it with `dotenv`, while the in-repo `jetpack docker …` (and `jp docker
# config`) parses it with `envfile`. The two diverge on a leading `export` (dotenv reads it, envfile
# doesn't), a `:` delimiter (envfile always; dotenv only for `KEY: value` with a space), and an
# inline ` # comment` (dotenv strips it, envfile keeps it). To behave the same whichever command you
# run, this script always WRITES plain `KEY=value`, which every parser reads identically. Two reads
# of an existing file follow, with opposite biases:
#   - OUR file (parse_env_line): trust only the plain `KEY=value` form. Anything else is treated as
#     absent and a clean `=` line is appended — last assignment wins for both parsers, so the clean
#     line becomes authoritative rather than the script no-opping behind a value one CLI would drop.
#   - A SIBLING file (parse_sibling_line): reserve the UNION of what either parser might bind, so we
#     never allocate a port/name a neighbouring worktree already occupies under its chosen command.

# Trim leading and trailing whitespace (bash 3.2 parameter expansion, no external process). Also
# strips a leading UTF-8 BOM, which JS `String.prototype.trim()` removes but `[[:space:]]` does not
# — otherwise a BOM-prefixed first line would read as a different key.
trim() {
	local s="$1"
	s="${s#$'\xEF\xBB\xBF'}"
	s="${s#"${s%%[![:space:]]*}"}"
	s="${s%"${s##*[![:space:]]}"}"
	printf '%s' "$s"
}

# Parse one .env line as the plain `KEY=value` shape when deciding what is already settled in OUR
# file (used by env_has_key / env_value). This deliberately recognizes only the common form both
# parsers read the same; a shape only one reads — a `:` delimiter, a leading `export`, an inline
# ` # comment` — is left for the rewrite path, which appends a clean `=` line both parsers then
# agree on. On a match set PARSED_KEY / PARSED_VAL and return 0, else return 1. (Note: a comment or
# `:` line has no `=` and fails the regex; an `export KEY=` line DOES match but yields key
# `export KEY`, which no lookup ever asks for — so it too is effectively absent.)
PARSED_KEY=""
PARSED_VAL=""
ENV_LINE_RE='^([^=#]+)=(.*)$'
parse_env_line() {
	[[ $1 =~ $ENV_LINE_RE ]] || return 1
	PARSED_KEY="$( trim "${BASH_REMATCH[1]}" )"
	PARSED_VAL="$( trim "${BASH_REMATCH[2]}" )"
	# Strip only a single matched surrounding quote pair — the one thing dotenv and envfile both do.
	# Removing every quote (envfile's own behavior) would over-normalize an unbalanced value like
	# `jetpack_"x` that dotenv keeps verbatim, hiding a Compose-invalid name from the guard below.
	case "$PARSED_VAL" in
		\"*\" ) PARSED_VAL="${PARSED_VAL#\"}"; PARSED_VAL="${PARSED_VAL%\"}" ;;
		\'*\' ) PARSED_VAL="${PARSED_VAL#\'}"; PARSED_VAL="${PARSED_VAL%\'}" ;;
	esac
	return 0
}

# Parse one SIBLING .env line as leniently as either parser might — strip a leading `export`, split
# on `=` OR `:`, drop an inline comment, strip quotes. This is the UNION (not the intersection):
# for collision avoidance we must reserve any port/name a sibling's `up` could actually occupy,
# whichever CLI ran it, and over-reserving merely skips a value (harmless). On a match set SIB_KEY /
# SIB_VAL and return 0, else return 1.
SIB_KEY=""
SIB_VAL=""
SIB_LINE_RE='^[[:space:]]*(export[[:space:]]+)?([^=:#[:space:]][^=:#]*)[[:space:]]*[=:](.*)$'
parse_sibling_line() {
	[[ $1 =~ $SIB_LINE_RE ]] || return 1
	SIB_KEY="$( trim "${BASH_REMATCH[2]}" )"
	SIB_VAL="${BASH_REMATCH[3]%%#*}"   # dotenv stops an unquoted value at the first `#`
	SIB_VAL="$( trim "$SIB_VAL" )"
	SIB_VAL="${SIB_VAL//\"/}"
	SIB_VAL="${SIB_VAL//\'/}"
	return 0
}

# Is key $1 assigned in a plain form both parsers read in $ENV_FILE? (Present-but-empty counts.)
env_has_key() {
	local line
	while IFS= read -r line || [ -n "$line" ]; do
		if parse_env_line "$line" && [ "$PARSED_KEY" = "$1" ]; then return 0; fi
	done < "$ENV_FILE"
	return 1
}

# Echo the value of key $1 in $ENV_FILE (last assignment wins), or nothing when the key is absent
# or not written in the plain form both parsers read.
env_value() {
	local line val=""
	while IFS= read -r line || [ -n "$line" ]; do
		if parse_env_line "$line" && [ "$PARSED_KEY" = "$1" ]; then val="$PARSED_VAL"; fi
	done < "$ENV_FILE"
	printf '%s' "$val"
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
			# Skip our own .env (git worktree list includes this worktree): assign_port reserves
			# our ports below, and counting our own name into CLAIMED_NAMES would make the
			# collision guard reject us on every re-run. `-ef` compares device+inode, so it holds
			# across symlinked or relative worktree paths.
			if [ "$sibling" -ef "$ENV_FILE" ]; then continue; fi
			# `|| [ -n "$kv" ]` so a final line with no trailing newline is still processed —
			# otherwise that sibling's last PORT_ would be missed and could be re-allocated.
			while IFS= read -r kv || [ -n "$kv" ]; do
				# Reserve anything a sibling could bind under EITHER parser (parse_sibling_line is
				# the lenient union), so we never hand ourselves a port/name a sibling's `up`
				# already occupies — whether that worktree runs `jp` or `jetpack`.
				parse_sibling_line "$kv" || continue
				case "$SIB_KEY" in
					PORT_* )
						case "$SIB_VAL" in
							'' | *[!0-9]* ) ;;  # not a plain number — no port to reserve
							* )
								val="$(( 10#$SIB_VAL ))"  # normalize so `08080` matches `8080`
								is_claimed "$val" || CLAIMED="${CLAIMED}${val} "
								;;
						esac
						;;
					COMPOSE_PROJECT_NAME )
						[ -n "$SIB_VAL" ] && CLAIMED_NAMES="${CLAIMED_NAMES}${SIB_VAL} "
						;;
				esac
			done < "$sibling"
			;;
	esac
done <<< "$WORKTREES"

# --- resolve the project name ----------------------------------------------

# Keep an existing COMPOSE_PROJECT_NAME untouched (respect `up --name`, hand edits, or a prior
# run); only derive and write a slug when none is set yet.
if env_has_key COMPOSE_PROJECT_NAME; then
	NAME_PRESENT=1
	INSTANCE="$( env_value COMPOSE_PROJECT_NAME )"

	# Trusting the existing name blindly is the one way this backfill lands two worktrees on one
	# instance behind a success message. jp docker up (augmentArgvFromEnvFile) only honors a name
	# shaped `jetpack_<x>` with <x> neither 'dev' nor 'e2e'; anything else — empty, a bare slug,
	# jetpack_dev/e2e — is ignored and silently drives the primary jetpack_dev containers and DB.
	# And a name another worktree already claimed would share that worktree's containers and DB.
	# Refuse both rather than seed ports around a name that was never going to isolate anything.
	suffix="${INSTANCE#jetpack_}"
	if [ "$suffix" = "$INSTANCE" ] || [ -z "$suffix" ] || [ "$suffix" = dev ] || [ "$suffix" = e2e ]; then
		echo "tools/docker/.env sets COMPOSE_PROJECT_NAME='${INSTANCE}', which jp docker up does not honor —" >&2
		echo "it would fall back to the primary jetpack_dev instance. Use jetpack_<unique>, or delete the line to re-derive one." >&2
		exit 1
	fi
	# Even a `jetpack_`-prefixed name is useless if Compose won't accept it (e.g. a space or an
	# uppercase letter pasted in): the CLI honors it, then `up` dies at the Compose layer. Reject it
	# here against Compose's own charset — the same rule normalizeProjectShortName (docker.js) checks.
	# Unlike the `--name` flag, which lowercases first, a .env value is used verbatim, so we reject
	# rather than repair.
	if ! [[ "$INSTANCE" =~ ^[a-z0-9][a-z0-9_-]*$ ]]; then
		echo "tools/docker/.env sets COMPOSE_PROJECT_NAME='${INSTANCE}', which Docker Compose rejects —" >&2
		echo "a project name must be lowercase letters, digits, '-' and '_', starting with a letter or digit. Fix or delete the line." >&2
		exit 1
	fi
	case "$CLAIMED_NAMES" in
		*" $INSTANCE "* )
			echo "tools/docker/.env sets COMPOSE_PROJECT_NAME='${INSTANCE}', but another worktree already uses that name." >&2
			echo "Two worktrees sharing a project name drive the same containers and DB. Pick a unique name, or delete the line to re-derive one." >&2
			exit 1
			;;
	esac
else
	NAME_PRESENT=0
	# GIT_ABS_DIR is …/worktrees/<id>, so this is git's worktree id (frozen at creation, and
	# already unique among worktrees), not the current folder name.
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
	# Display only; `|| true` so a zero-match grep can't abort under pipefail before `exit 0`.
	{ grep -E '^[[:space:]]*(COMPOSE_PROJECT_NAME|PORT_[A-Z]+)[[:space:]]*=' "$ENV_FILE" | sed 's/^/  /'; } || true
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
