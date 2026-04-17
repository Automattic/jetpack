#!/usr/bin/env bash
# Allocate a free five-port tuple for a parallel `jp docker` instance.
#
# Bands are deterministic so repeat runs for the same slug land in the same
# band when it's free. The script only picks an empty band — it never tries
# to reuse a partially-occupied one.
#
# Usage:   alloc-ports.sh <slug>
# Output:  JSON on stdout: {"band":N,"wp":N,"phpmy":N,"inbox":N,"smtp":N,"sftp":N}
# Exit:    0 ok, 1 bad args, 2 no free band.

set -euo pipefail

if [[ $# -lt 1 ]]; then
	echo "Usage: $0 <slug>" >&2
	exit 1
fi

slug="$1"

# Keep in sync with the Port allocation table in work-on.md.
bands=(
	"1 8080 8281 1180 2525 1122"
	"2 8090 8381 1280 2626 1222"
	"3 8100 8481 1380 2727 1322"
	"4 8110 8581 1480 2828 1422"
)

busy=$(docker ps --format '{{.Ports}}' 2>/dev/null \
	| grep -oE '[0-9]+->' | cut -d'-' -f1 | sort -un || true)

is_busy() {
	local port="$1"
	[[ -z "$busy" ]] && return 1
	grep -qxF "$port" <<< "$busy"
}

# Deterministic starting band from slug hash.
slug_hash=$(printf '%s' "$slug" | cksum | cut -d ' ' -f 1)
start=$(( slug_hash % ${#bands[@]} ))

for (( i = 0; i < ${#bands[@]}; i++ )); do
	idx=$(( (start + i) % ${#bands[@]} ))
	read -r band wp phpmy inbox smtp sftp <<< "${bands[$idx]}"
	if ! is_busy "$wp" && ! is_busy "$phpmy" && ! is_busy "$inbox" \
	  && ! is_busy "$smtp" && ! is_busy "$sftp"; then
		printf '{"band":%s,"wp":%s,"phpmy":%s,"inbox":%s,"smtp":%s,"sftp":%s}\n' \
			"$band" "$wp" "$phpmy" "$inbox" "$smtp" "$sftp"
		exit 0
	fi
done

echo "No free port band. Busy ports: ${busy:-none}" >&2
exit 2
