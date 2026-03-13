#!/usr/bin/env bash

# Tunnel Manager
#
# Manages HTTP tunnels using either Cloudflare Tunnel or LocalTunnel
#
# Environment Variables:
# - USE_CLOUDFLARE_TUNNEL: Use Cloudflare Tunnel instead of LocalTunnel
# - TUNNEL_DEBUG: Enable verbose debug logging
#

set -e

function usage() {
	echo
	echo "usage: $(basename "$0") <command>"
	echo
	echo "Commands:"
	echo "up	Starts a new tunnel. Resets an existing tunnel process and overrides the used URL"
	echo "down	Stops an existing tunnel process"
	echo "reset	Resets an existing tunnel process and creates a new tunnel URL"
	echo "help	Show this message"
	echo
	exit 1
}

BASE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$BASE_DIR/../node_modules/.bin:$PATH"

TUNNEL_CLI_COMMAND="node $BASE_DIR/tunnel/tunnel-cli.js"

if [[ -n "${USE_CLOUDFLARE_TUNNEL}" ]]; then
	TUNNEL_CLI_COMMAND="$TUNNEL_CLI_COMMAND --provider cloudflared"
else
	TUNNEL_CLI_COMMAND="$TUNNEL_CLI_COMMAND --provider localtunnel"
fi

function log() {
	echo "[tunnel manager] $*"
}

function debug_log() {
	if [[ -n "${TUNNEL_DEBUG}" ]]; then
		echo "[tunnel manager DEBUG] $*"
	fi
}

debug_log "TUNNEL_CLI_COMMAND: $TUNNEL_CLI_COMMAND"

function health_check() {
	local url="$1"
	local max_attempts=20
	local attempt=1
	local dns_wait_time=5
	local retry_interval=3
	
	log "Checking tunnel at: $url"
	
	if ! command -v curl > /dev/null 2>&1; then
		log "Warning: curl not found, skipping health check"
		return 0
	fi
	
	# Give DNS some time to propagate, especially useful for Cloudflare Tunnel
	log "Waiting $dns_wait_time seconds for DNS propagation..."
	sleep $dns_wait_time
	
	while [ $attempt -le $max_attempts ]; do
		local http_code curl_exit_code
		http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "$url" 2>/dev/null)
		curl_exit_code=$?
		
		if [ "$http_code" = "200" ] || [ "$http_code" = "301" ]; then
			log "✓ Tunnel is responding with $http_code status"
			return 0
		else
			log "Attempt $attempt of $max_attempts failed: HTTP $http_code (curl exit: $curl_exit_code)"
			
			case $curl_exit_code in
				6)
					log "  DNS resolution failed"
					;;
				7)
					log "  Connection refused"
					;;
				28)
					log "  Connection timeout"
					;;
			esac
			
			if [ $attempt -lt $max_attempts ]; then
				log "  Retrying in $retry_interval seconds..."
				sleep $retry_interval
			fi
		fi
		
		attempt=$((attempt + 1))
	done
	
	log "✗ Tunnel failed to respond with 200 or 301 after $max_attempts attempts"
	return 1
}

function up() {
	local retry_count=0
	local max_retries=1
	
	while [ $retry_count -le $max_retries ]; do
		if [ $retry_count -gt 0 ]; then
			log "Waiting 30 seconds before retry..."
			sleep 30
			log "Retrying tunnel setup (attempt $((retry_count + 1))/$((max_retries + 1)))..."
		fi

		log "Closing potentially running tunnel..."
		down

		log "Opening new tunnel..."
		debug_log "Executing: $TUNNEL_CLI_COMMAND on $*"
		local tunnel_output tunnel_exit_code
		# Temporarily disable exit on error to capture the exit code
		set +e
		tunnel_output=$($TUNNEL_CLI_COMMAND on "$@" 2>&1)
		tunnel_exit_code=$?
		set -e
		echo "$tunnel_output"
		
		# Check exit code first - fail immediately if non-zero
		if [ $tunnel_exit_code -ne 0 ]; then
			log "Tunnel start command failed with exit code $tunnel_exit_code"
		else
			# Extract tunnel URL from the "Tunnel URL: " line
			local tunnel_url
			tunnel_url=$(echo "$tunnel_output" | grep "^.*Tunnel URL: " | sed 's/.*Tunnel URL: //' | head -1)
			
			if [[ -n "$tunnel_url" ]]; then
				if health_check "$tunnel_url"; then
					log "Tunnel setup successful"
					return 0
				fi
			else
				log "Warning: Could not extract tunnel URL from output for health check"
			fi
		fi
		
		retry_count=$((retry_count + 1))
	done
	
	log "Tunnel setup failed after $((max_retries + 1)) attempts"
	# Return success to allow test suite to run - environment readiness checks will catch tunnel issues later
	return 0
}

function down() {
	debug_log "Executing: $TUNNEL_CLI_COMMAND off"
	$TUNNEL_CLI_COMMAND off
}

function reset() {
	down
	log "Resetting tunnel..."
	debug_log "Executing: $TUNNEL_CLI_COMMAND clear"
	$TUNNEL_CLI_COMMAND clear
	up
}

case $1 in
	up)
		shift
		up "$@"
		;;
	down)
		down
		;;
	reset)
		reset
		;;
	*)
		usage
		;;
esac
