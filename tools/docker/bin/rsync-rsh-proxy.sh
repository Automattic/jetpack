#!/bin/bash
# rsync-rsh-proxy.sh - Proxies SSH connections through a TCP socket to the host
# Used by jp rsync to allow host SSH authentication while rsync runs in Docker
#
# This script is invoked by rsync's --rsh option. It receives the SSH command
# arguments, connects to a TCP server running on the host, sends the command,
# and then proxies stdin/stdout through the socket.
#
# Protocol:
#   1. Connect to host TCP server
#   2. Send SSH args as a JSON array on the first line
#   3. Proxy stdin/stdout bidirectionally
#
# Environment variables:
#   RSYNC_PROXY_PORT - TCP port on the host where jp is listening

if [[ -z "${RSYNC_PROXY_PORT:-}" ]]; then
    echo "Error: RSYNC_PROXY_PORT not set" >&2
    exit 1
fi

{
    jq -nc '$ARGS.positional' --args -- ssh "$@"
    cat
} | socat STDIO "TCP:host.docker.internal:$RSYNC_PROXY_PORT"
