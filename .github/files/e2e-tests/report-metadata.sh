if [[ -z "$RUN_ID" ]]; then
	echo "RUN_ID is not defined, using pull request number or branch"

	if [[ -z "$PR_NUMBER" ]]; then
		echo "PR_NUMBER is not defined, using branch"
		if [ "$GITHUB_EVENT_NAME" == pull_request ]; then
        BRANCH=$GITHUB_HEAD_REF
    else
        BRANCH=${GITHUB_REF:11}
    fi
    RUN_ID=$BRANCH
  else
  	RUN_ID=$PR_NUMBER
	fi
fi

jq -n --arg runId "$RUN_ID" '{runId:$runId}' > report-metadata.json
cat report-metadata.json
