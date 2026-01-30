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
#   2. Send SSH command as newline-terminated string
#   3. Proxy stdin/stdout bidirectionally
#
# Environment variables:
#   RSYNC_PROXY_PORT - TCP port on the host where jp is listening

if [[ -z "${RSYNC_PROXY_PORT:-}" ]]; then
    echo "Error: RSYNC_PROXY_PORT not set" >&2
    exit 1
fi

# Build the SSH command line with properly escaped arguments
CMD="ssh"
for arg in "$@"; do
    CMD="$CMD $(printf '%q' "$arg")"
done

# Save original stdin to fd 3
exec 3<&0

# Create two FIFOs for bidirectional communication
FIFO_TO_TCP=$(mktemp -u)
FIFO_FROM_TCP=$(mktemp -u)
mkfifo "$FIFO_TO_TCP" "$FIFO_FROM_TCP"

# Cleanup function
cleanup() {
    rm -f "$FIFO_TO_TCP" "$FIFO_FROM_TCP"
    kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Start socat to bridge the FIFOs to TCP
# Reads from FIFO_TO_TCP, writes to FIFO_FROM_TCP, bidirectionally with TCP
socat "OPEN:$FIFO_TO_TCP,rdonly!!OPEN:$FIFO_FROM_TCP,wronly" "TCP:host.docker.internal:$RSYNC_PROXY_PORT" &
SOCAT_PID=$!

# Give socat time to open the FIFOs
sleep 0.1

# Background writer: sends command then relays stdin to the TO_TCP fifo
(
    echo "$CMD"
    cat <&3
) > "$FIFO_TO_TCP" 2>/dev/null &
WRITER_PID=$!

# Foreground reader: reads from FROM_TCP fifo and outputs to stdout (for rsync)
cat < "$FIFO_FROM_TCP"

# Wait for socat
wait $SOCAT_PID 2>/dev/null
EXIT_CODE=$?

# Kill the writer if still running
kill $WRITER_PID 2>/dev/null || true

exit $EXIT_CODE
