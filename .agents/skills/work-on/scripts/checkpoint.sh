#!/usr/bin/env bash
# Record /work-on progress at a phase boundary.
#
# Writes `<worktree>/.work-on/status.json` — the file a coordinator (e.g. the
# centurion skill) polls to see where a worker got to. Distinct from env.json:
# env.json is the one-shot session record written in Phase 3 and read by Mode 3
# on resume; status.json is rewritten at every phase boundary and is the only
# file that describes *progress*. Never merge the two.
#
# The write is atomic (temp file + mv) because a poller can read at any instant;
# a half-written file would hand it invalid JSON.
#
# Fields not passed on this invocation are carried over from the existing file,
# so a call that only reports an action keeps the phase, PR, and blocker intact.
#
# Usage:
#   checkpoint.sh --phase <n> --name <phase-name> [options]
#
#   --phase <n>          Phase number (0–11).
#   --name <text>        Phase name, e.g. "Quality gates".
#   --state <s>          running | blocked | done | failed. Default: running.
#   --action <text>      One line on what just happened.
#   --blocker <text>     What the worker is stuck on. Implies --state blocked.
#   --clear-blocker      Drop a previously recorded blocker.
#   --pr <url>           Draft PR URL, once opened.
#
# Run from anywhere inside the worktree.
# Exit: 0 ok, 1 bad args, 2 not in a git worktree, 3 jq missing.

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "checkpoint.sh: jq is required" >&2; exit 3; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "checkpoint.sh: not inside a git worktree" >&2; exit 2; }

phase="" name="" state="" action="" blocker="" pr="" clear_blocker=0

while [[ $# -gt 0 ]]; do
	case "$1" in
		--phase)         phase="${2:-}"; shift 2 ;;
		--name)          name="${2:-}"; shift 2 ;;
		--state)         state="${2:-}"; shift 2 ;;
		--action)        action="${2:-}"; shift 2 ;;
		--blocker)       blocker="${2:-}"; shift 2 ;;
		--pr)            pr="${2:-}"; shift 2 ;;
		--clear-blocker) clear_blocker=1; shift ;;
		*) echo "checkpoint.sh: unknown argument '$1'" >&2; exit 1 ;;
	esac
done

if [[ -n "$state" && ! "$state" =~ ^(running|blocked|done|failed)$ ]]; then
	echo "checkpoint.sh: --state must be running, blocked, done, or failed" >&2
	exit 1
fi

# A blocker without an explicit state means blocked; that's the whole point of reporting one.
if [[ -n "$blocker" && -z "$state" ]]; then
	state="blocked"
fi

# Clearing a blocker without saying what to move to means the worker resumed. Without this the
# carried-over "blocked" would stick and the coordinator's board would never unblock.
if [[ "$clear_blocker" = 1 && -z "$state" ]]; then
	state="running"
fi

STATUS_DIR="$ROOT/.work-on"
STATUS="$STATUS_DIR/status.json"
mkdir -p "$STATUS_DIR"

# Slug: prefer the session record, fall back to the branch name.
slug=""
if [[ -f "$STATUS_DIR/env.json" ]]; then
	slug="$( jq -r '.slug // empty' "$STATUS_DIR/env.json" 2>/dev/null || true )"
fi
if [[ -z "$slug" ]]; then
	branch="$( git -C "$ROOT" branch --show-current 2>/dev/null || true )"
	slug="${branch#change/}"
fi

# Carry over whatever is already recorded; start from an empty object on first run.
base='{}'
if [[ -s "$STATUS" ]]; then
	base="$( jq '.' "$STATUS" 2>/dev/null || echo '{}' )"
fi

updated="$( date -u +%Y-%m-%dT%H:%M:%SZ )"

new="$(
	jq \
		--arg slug "$slug" \
		--arg worktree "$ROOT" \
		--arg phase "$phase" \
		--arg name "$name" \
		--arg state "$state" \
		--arg action "$action" \
		--arg blocker "$blocker" \
		--arg pr "$pr" \
		--arg updated "$updated" \
		--argjson clear "$clear_blocker" \
		'
		. as $base
		| $base
		+ { slug: $slug, worktree: $worktree, updated: $updated }
		+ ( if $phase   == "" then {} else { phase: ( $phase | tonumber ) } end )
		+ ( if $name    == "" then {} else { phase_name: $name } end )
		+ ( if $state   == "" then {} else { state: $state } end )
		+ ( if $action  == "" then {} else { last_action: $action } end )
		+ ( if $pr      == "" then {} else { pr: $pr } end )
		+ ( if $clear == 1 then { blocker: null }
		    elif $blocker == "" then {}
		    else { blocker: $blocker } end )
		| { slug, worktree, phase, phase_name, state, last_action, blocker, pr, updated }
		| .state      //= "running"
		| .blocker    //= null
		| .pr         //= null
		' <<<"$base"
)"

tmp="$( mktemp "$STATUS_DIR/.status.json.XXXXXX" )"
printf '%s\n' "$new" > "$tmp"
mv -f "$tmp" "$STATUS"

echo "$STATUS"
