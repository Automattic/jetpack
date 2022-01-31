#!/bin/bash

set -eo pipefail

PROJECTS=('{"project":"Jetpack","path":"projects/plugins/jetpack/tests/e2e","testArgs":"","slackArgs":""}' '{"project":"Boost","path":"projects/plugins/boost/tests/e2e","testArgs":"","slackArgs":""}')
PROJECTS_MATRIX=()
RUN_NAME=''

CHANGED_PROJECTS="$(.github/files/list-changed-projects.sh)"
#echo "$CHANGED_PROJECTS"

# gutenberg scheduled run
#if [ "$CRON" == "0 */12 * * *" ]; then
if [ "$GITHUB_EVENT_NAME" == "push" ]; then
  PROJECTS_MATRIX+=('{"project":"Jetpack with Gutenberg","path":"projects/plugins/jetpack/tests/e2e","testArgs":"blocks","slackArgs":"--report gutenberg"}')
  RUN_NAME='gutenberg'
fi

# atomic scheduled run
#if [ "$CRON" == "0 */12 * * *" ]; then
if [ "$GITHUB_EVENT_NAME" == "push" ]; then
  PROJECTS_MATRIX+=('{"project":"Jetpack on Atomic","path":"projects/plugins/jetpack/tests/e2e","testArgs":"blocks --grep-invert wordads","slackArgs":"--report atomic"}')
  RUN_NAME='test-run-name'
fi

for PROJECT in "${PROJECTS[@]}"; do
	PROJECT_NAME=$(jq -r ".project" <<<"$PROJECT")
	PROJECT_PATH=$(jq -r ".path" <<<"$PROJECT")
	TARGET_PROJECTS=$(jq -r -e ".ci.targets[]" "$PROJECT_PATH/package.json")

	if [ "$TARGET_PROJECTS" == "" ]; then
		# if no target projects are found run the tests
		PROJECTS_MATRIX+=("$PROJECT")
	else
		# iterate over defined target plugins/projects and see if they are changed
		for TESTED_PROJECT in $TARGET_PROJECTS; do
			RESULT=$(jq --arg prj "$TESTED_PROJECT" '.[$prj]' <<<"$CHANGED_PROJECTS")
			#	printf "%s: %s" "$TESTED_PROJECT" "$RESULT"
			if [[ "$RESULT" == true ]]; then
				PROJECTS_MATRIX+=("$PROJECT")
				#	printf " ==> %s tests should run\n" "$PROJECT_NAME"
				break
			fi
		done
	fi
done

jq -n -c --arg runName "$RUN_NAME" --argjson projects "$(jq -s -c -r '.' <<<"${PROJECTS_MATRIX[@]}")" '{ "run": $runName, "matrix": $projects }'
