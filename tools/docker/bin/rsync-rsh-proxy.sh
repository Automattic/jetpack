#!/bin/bash
# rsync-rsh-proxy.sh - Proxies SSH connections through a Unix domain socket to the host
# Used by jp rsync to allow host SSH authentication while rsync runs in Docker
#
# This script is invoked by rsync's --rsh option. It receives the SSH command
# arguments, connects to a Unix domain socket mounted from the host, sends the
# command, and then proxies stdin/stdout through the socket.
#
# Protocol:
#   1. Connect to host Unix domain socket
#   2. Send SSH args as a JSON array on the first line
#   3. Proxy stdin/stdout bidirectionally
#
# Environment variables:
#   RSYNC_PROXY_SOCKET - Path to the Unix domain socket inside the container

if [[ -z "${RSYNC_PROXY_SOCKET:-}" ]]; then
    echo "Error: RSYNC_PROXY_SOCKET not set" >&2
    exit 1
fi
if [[ -z "${RSYNC_PROXY_SECRET:-}" ]]; then
    echo "Error: RSYNC_PROXY_SECRET not set" >&2
    exit 1
fi

exec socat STDIO "UNIX-CONNECT:$RSYNC_PROXY_SOCKET" < <(
    jq -nc '$ARGS.positional' --args -- "$RSYNC_PROXY_SECRET" ssh "$@"
    cat
)
