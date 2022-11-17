if [[ -z "$SUITE" ]]; then
	echo "SUITE is not defined, using pull request number or branch"

	if [[ -z "$PR_NUMBER" ]]; then
		echo "PR_NUMBER is not defined, using branch"
		if [ "$GITHUB_EVENT_NAME" == pull_request ]; then
			BRANCH=$GITHUB_HEAD_REF
		else
			BRANCH=${GITHUB_REF:11}
		fi
		SUITE=$BRANCH
	else
		SUITE=$PR_NUMBER
	fi
fi

jq -n --arg runId "$SUITE" '{suite:$suite}' >"$OUTPUT_PATH/output/report-metadata.json"
cat report-metadata.json
