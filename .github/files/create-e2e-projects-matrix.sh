#!/bin/bash

set -eo pipefail

PROJECTS=('{"project":"Jetpack","path":"projects/plugins/jetpack/tests/e2e","testArgs":[],"slackArgs":[]}' '{"project":"Boost","path":"projects/plugins/boost/tests/e2e","testArgs":[],"slackArgs":[]}')
PROJECTS_MATRIX=()
RUN_NAME=''

if [[ "$GITHUB_EVENT_NAME" == "pull_request" || "$GITHUB_EVENT_NAME" == "push" ]]; then
	CHANGED_PROJECTS="$(.github/files/list-changed-projects.sh)"

	for PROJECT in "${PROJECTS[@]}"; do
		PROJECT_PATH=$(jq -r ".path" <<<"$PROJECT")
		TARGETS=$(jq -r -e ".ci.targets" "$PROJECT_PATH/package.json")

		if [[ "$TARGETS" == "[]" || "$TARGETS" == "" ]]; then
			# if no target projects are found run the tests
			PROJECTS_MATRIX+=("$PROJECT")
		else
			# iterate over defined target plugins/projects and see if they are changed
			for TARGET in $(jq -r -e ".[]" <<<"$TARGETS"); do
				RESULT=$(jq --arg prj "$TARGET" '.[$prj]' <<<"$CHANGED_PROJECTS")
				if [[ "$RESULT" == true ]]; then
					PROJECTS_MATRIX+=("$PROJECT")
					break
				fi
			done
		fi
	done
else
	# gutenberg scheduled run
	if [ "$CRON" == "0 */12 * * *" ]; then
		PROJECTS_MATRIX+=('{"project":"Jetpack with Gutenberg","path":"projects/plugins/jetpack/tests/e2e","testArgs":["blocks"],"slackArgs":["--report", "gutenberg"]}')
		RUN_NAME='gutenberg'
	fi

	# atomic scheduled run
	if [ "$CRON" == "30 */4 * * *" ]; then
		PROJECTS_MATRIX+=('{"project":"Jetpack on Atomic","path":"projects/plugins/jetpack/tests/e2e","testArgs":["blocks", "--grep-invert", "wordads"],"slackArgs":["--report", "atomic"]}')
		RUN_NAME='atomic'
	fi
fi

jq -n -c --arg runName "$RUN_NAME" --argjson projects "$(jq -s -c -r '.' <<<"${PROJECTS_MATRIX[@]}")" '{ "run": $runName, "matrix": $projects }'
