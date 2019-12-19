#!/bin/bash

# Instructions
function usage {
	echo "usage: $0 [ -g <groupname>] [-g <groupname> -b <branchname>]"
	echo "  -g     Name of the test group or testsuite name as defined in phpunit.xml.dist (Default: external-http)"
	echo "  -t     Custom Travis API token"
	echo "  -b     Branch to run Travis build against"
	echo "  -d     Dry run, which will not trigger an actuall request"
	echo "  -h     Show this message"
	exit 0
}

function send_travis_api_request {
	body="{
		\"request\": {
			\"branch\": \"${BRANCH_NAME}\",
			\"config\": {
				\"merge_mode\": \"deep_merge\",
				\"env\": {
					\"global\": {
						\"PHPUNIT_COMMAND_OVERRIDE\": \"'phpunit --group ${GROUP_NAME}'\",
						\"WP_TRAVISCI\": \"phpunit\"
					}
				},
				\"branches\": {
					\"only\": [\"${BRANCH_NAME}\"]
				}
			}
		}
	}"

	if [ ! -z ${DRY_RUN} ]; then
		echo $DRY_RUN
		echo "DRY RUN! Not sending an actual request"
		echo $body
		exit 1
	fi

response=$(
	curl -s -X POST \
		-H "Content-Type: application/json" \
		-H "Accept: application/json" \
		-H "Travis-API-Version: 3" \
		-H "Authorization: token ${TRAVIS_TOKEN}" \
		-d "$body" \
		https://api.travis-ci.org/repo/Automattic%2Fjetpack/requests
)
}

function ask_branch_confirmation {
	read -p "No branch name is set. Do you want to trigger a build against your local branch(on remote) (y/n)? " choice
	case "$choice" in
		y|Y ) BRANCH_NAME=$CURRENT_BRANCH;;
		* ) echo "Bailing. Please pass your desired branch name as argument" && echo && usage;;
	esac
}

function validate_input {
	for index in "${!opts_array[@]}"; do
		# checking if the Travis token is properly set.
		if [[ ${opts_array[index]} == "TOKEN" && -z "$TOKEN" ]]; then
			if [ -z "$TRAVIS_TOKEN" ]; then
				echo "Sorry! Travis token is not set. Make sure to set a \$TRAVIS_TOKEN env variable, or pass it via '-t' option. You can get your own right here: https://travis-ci.org/account/preferences"
				exit 1
			else
				TOKEN=$TRAVIS_TOKEN
			fi

		# figuring out what branch to use
		elif [[ ${opts_array[index]} == "BRANCH_NAME" ]]; then
			if [ -z "$BRANCH_NAME" ]; then
				ask_branch_confirmation
				echo "Using your current \"${CURRENT_BRANCH}\" branch."
			fi

		# figuring out what test group to run
		elif [[ ${opts_array[index]} == "GROUP_NAME" ]]; then
			if [ -z "$GROUP_NAME" ]; then
				GROUP_NAME=$DEFAULT_GROUP
				echo "Running tests for default \"${GROUP_NAME}\" test group."
			fi
		fi
	done
}

# Current directory and current branch vars
DIR=$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" )
CURRENT_BRANCH=$( git branch | grep -e "^*" | cut -d' ' -f 2 )
DEFAULT_GROUP="external-http"


while getopts :g:t:b:dh option; do
	case "${option}" in
		g)
			GROUP_NAME=${OPTARG}
			echo "GROUP_NAME: $GROUP_NAME"
			;;
		t)
			TOKEN=${OPTARG}
			echo "TOKEN: $TOKEN"
			;;
		b)
			BRANCH_NAME=${OPTARG}
			echo "BRANCH_NAME: $BRANCH_NAME"
			;;
		d)
			DRY_RUN="true"
			echo "DRY_RUN: $DRY_RUN"
			;;
		h)
			usage
			;;
		\? )
			echo "Invalid Option: -$OPTARG" 1>&2
			usage
			;;
	esac
done

opts_array=(TOKEN GROUP_NAME BRANCH_NAME)

validate_input
send_travis_api_request
echo $response

