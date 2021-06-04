#!/usr/bin/env bash

set -eo pipefail


if [[ -z "$TOKEN" ]]; then
	echo "::error::TOKEN must be set"
	exit 1
fi


if [ "$GITHUB_EVENT_NAME" == pull_request ]; then
	BRANCH=$GITHUB_HEAD_REF
else
	BRANCH=${GITHUB_REF:11}
fi

curl -X POST https://api.github.com/repos/automattic/jetpack-e2e-reports/dispatches \
	-H "Accept: application/vnd.github.v3+json" \
  -u user:"$TOKEN" \
  --data "{'event_type': 'Run $GITHUB_RUN_ID',
  'client_payload': {
  'repository': '$GITHUB_REPOSITORY',
  'run_id': '$GITHUB_RUN_ID',
  'run_number': '$GITHUB_RUN_NUMBER',
  'branch': $BRANCH
  }}"
