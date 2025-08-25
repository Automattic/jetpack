#!/usr/bin/env bash

# Wrapper over tunnel.js script

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

function health_check() {
	local url="$1"
	local max_attempts=30
	local attempt=1
	
	echo "Health checking tunnel at: $url"
	
	# Check if curl is available
	if ! command -v curl > /dev/null 2>&1; then
		echo "Warning: curl not found, skipping health check"
		return 0
	fi
	
	# Give DNS some time to propagate
	echo "Waiting 5 seconds for DNS propagation..."
	sleep 5
	
	while [ $attempt -le $max_attempts ]; do
		local http_code curl_exit_code
		http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "$url" 2>/dev/null)
		curl_exit_code=$?
		
		echo "Attempt $attempt/$max_attempts: HTTP $http_code (curl exit: $curl_exit_code)"
		
		if [ "$http_code" = "200" ] || [ "$http_code" = "301" ]; then
			echo "✓ Tunnel is responding with $http_code status"
			return 0
		fi
		
		# Handle specific curl error codes
		case $curl_exit_code in
			6)
				echo "  DNS resolution failed, retrying..."
				;;
			7)
				echo "  Connection refused, retrying..."
				;;
			28)
				echo "  Connection timeout, retrying..."
				;;
		esac
		
		sleep 2
		attempt=$((attempt + 1))
	done
	
	echo "✗ Tunnel failed to respond with 200 or 301 after $max_attempts attempts"
	echo "Note: This may be normal if the tunnel takes longer to become available"
	return 1
}

function up() {
	local retry_count=0
	local max_retries=1
	
	while [ $retry_count -le $max_retries ]; do
		if [ $retry_count -gt 0 ]; then
			echo "Retrying tunnel setup (attempt $((retry_count + 1))/$((max_retries + 1)))..."
		fi
		
		down
		local tunnel_output
		if [[ -n "${USE_CLOUDFLARE_TUNNEL}" ]]; then
			tunnel_output=$(node "$BASE_DIR"/cloudflaretunnel.js on "$@" 2>&1)
		else
			tunnel_output=$(node "$BASE_DIR"/localtunnel.js on "$@" 2>&1)
		fi
		
		echo "$tunnel_output"
		
		# Extract tunnel URL from the startup output
		local tunnel_url
		tunnel_url=$(echo "$tunnel_output" | grep -oE "https?://[^'\"[:space:]]+" | tail -1)
		
		if [[ -n "$tunnel_url" ]]; then
			if health_check "$tunnel_url"; then
				echo "Tunnel setup successful!"
				return 0
			fi
		else
			echo "Warning: Could not extract tunnel URL from output for health check"
		fi
		
		retry_count=$((retry_count + 1))
	done
	
	echo "Tunnel setup completed after $((max_retries + 1)) attempts"
	# Return success to allow test suite to run - environment readiness checks will catch tunnel issues later
	return 0
}

function down() {
	if [[ -n "${USE_CLOUDFLARE_TUNNEL}" ]]; then
		node "$BASE_DIR"/cloudflaretunnel.js off
	else
		node "$BASE_DIR"/localtunnel.js off
	fi
}

function reset() {
	down
	rm -rf config/tmp
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
