#!/bin/bash

# Sends a tracks event.
# - 1: Event name
# - 2: An optional JSON-formatted payload of extra tracks params, e.g. `{"a":1, "b":2}`
function send_tracks_event {
	# Bail if no event name is provided.
	if [[ -z "$1" ]]; then
		return
	fi

	local TRACKS_URL TRACKS_RESPONSE USER_AGENT PAYLOAD
	TRACKS_URL='https://public-api.wordpress.com/rest/v1.1/tracks/record?http_envelope=1'
	USER_AGENT='jetpack-monorepo-cli'
	PAYLOAD=$(jq -nr --arg email "$(git config --get user.email)" '.commonProps._ul = $email')

	# Add event name to payload.
	PAYLOAD=$(jq -r --arg eventName "$1" '.events = [{_en: $eventName}]' <<< "$PAYLOAD")

	# Add extra params to payload if provided.
	if [[ -n "$2" ]]; then
		PAYLOAD=$(jq --argjson extraParams "$2" '.events[0] += $extraParams' <<< "$PAYLOAD")
	fi

	# True on fail to bypass pipefail.
	TRACKS_RESPONSE=$(curl --fail -sS "$TRACKS_URL" \
		-H "User-Agent: $USER_AGENT" \
		-H 'Accept-Encoding: gzip, deflate' \
		-H 'Content-Type: application/json' \
		-H 'Accept: application/json' \
		--data "$PAYLOAD" \
		--compressed 2>&1 || true)

	if ! jq -e . <<< "$TRACKS_RESPONSE" &> /dev/null; then
		# Likely a cURL error response.
		echo "Invalid response: $TRACKS_RESPONSE"
	elif ! jq -e '.code == 202' <<< "$TRACKS_RESPONSE" &> /dev/null; then
		# Likely a Tracks error response.
		echo "Failed Tracks call: $TRACKS_RESPONSE"
	fi
}
