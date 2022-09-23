#!/bin/bash

set -eo pipefail

PROJECTS=('{"project":"Jetpack connection","path":"projects/plugins/jetpack/tests/e2e","testArgs":["specs/connection","--retries=2"]}' '{"project":"Jetpack pre-connection","path":"projects/plugins/jetpack/tests/e2e","testArgs":["specs/pre-connection","--retries=2"]}' '{"project":"Jetpack post-connection","path":"projects/plugins/jetpack/tests/e2e","testArgs":["specs/post-connection","--retries=2"]}' '{"project":"Jetpack sync","path":"projects/plugins/jetpack/tests/e2e","testArgs":["specs/sync","--retries=2"]}' '{"project":"Jetpack blocks","path":"projects/plugins/jetpack/tests/e2e","testArgs":["specs/blocks","--retries=2"]}' '{"project":"Boost","path":"projects/plugins/boost/tests/e2e","testArgs":[]}' '{"project":"Search","path":"projects/plugins/search/tests/e2e","testArgs":[]}' '{"project":"VideoPress","path":"projects/plugins/videopress/tests/e2e","testArgs":[]}')

## Update test only works with local build and workflow_run uses CI built artefacts
if [[ "$GITHUB_EVENT_NAME" != "workflow_run" ]]; then
	PROJECTS+=('{"project":"Jetpack update","path":"projects/plugins/jetpack/tests/e2e","testArgs":["plugin-update","--retries=2"]}')
fi

PROJECTS_MATRIX=()
RUN_NAME=''

if [[ "$GITHUB_EVENT_NAME" == "pull_request" ]]; then
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
elif [[ "$GITHUB_EVENT_NAME" == "push" || "$GITHUB_EVENT_NAME" == "workflow_run" ]]; then
	PROJECTS_MATRIX=("${PROJECTS[*]}")
elif [[ "$GITHUB_EVENT_NAME" == "schedule" ]]; then
	# gutenberg scheduled run
  	if [ "$CRON" == "0 */12 * * *" ]; then
  		PROJECTS_MATRIX+=('{"project":"Jetpack with Gutenberg","path":"projects/plugins/jetpack/tests/e2e","testArgs":["blocks","--retries=2"]}')
  		RUN_NAME='gutenberg'
  	fi

  	# atomic scheduled run
  	if [ "$CRON" == "30 */4 * * *" ]; then
  		PROJECTS_MATRIX+=('{"project":"Jetpack on Atomic","path":"projects/plugins/jetpack/tests/e2e","testArgs":["blocks", "--grep-invert", "wordads", "--retries=2"]}')
  		RUN_NAME='atomic'
  	fi
else
	echo "Unsupported GITHUB_EVENT_NAME \"$GITHUB_EVENT_NAME\""
fi

jq -n -c --arg runName "$RUN_NAME" --argjson projects "$(jq -s -c -r '.' <<<"${PROJECTS_MATRIX[@]}")" '{ "run": $runName, "matrix": $projects }'
