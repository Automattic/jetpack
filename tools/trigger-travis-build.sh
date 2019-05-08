#!/bin/bash

# Instructions
function usage {
	echo "usage: $0 [ -g <groupname>] [-g <groupname> -b <branchname>]"
	echo "  -g     Name of the test group or testsuite name as defined in phpunit.xml.dist (Default: external-http)"
	echo "  -t     Custom Travis API token"
	echo "  -b     Branch to use (Default: your local branch)"
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
					\"global\": ['PHPUNIT_COMMAND_OVERRIDE=\"phpunit --group ${GROUP_NAME}\"']
				}
			}
		}
	}"

	echo $body

		curl -v -s -X POST \
		-H "Content-Type: application/json" \
		-H "Accept: application/json" \
		-H "Travis-API-Version: 3" \
		-H "Authorization: token ${TRAVIS_TOKEN}" \
		-d "$body" \
		https://api.travis-ci.org/repo/Automattic%2Fjetpack/requests
		# -H "Authorization: token ${TOKEN}" \
}

function validate_input {
	for index in "${!opts_array[@]}"; do
		# checking if the Travis token is properly set.
		if [[ ${opts_array[index]} == "TOKEN" && -z "$TOKEN" ]]; then
			if [ -z "$TRAVIS_TOKEN" ]; then
				echo "Sorry! Travis token is not set. Make sure to set a \$TRAVIS_TOKEN env variable, or pass it via '-t' option. You can get one right here: https://travis-ci.org/account/preferences"
				exit 1
			else
				TOKEN=$TRAVIS_TOKEN
			fi

		# figuring out what branch to use
		elif [[ ${opts_array[index]} == "BRANCH_NAME" ]]; then
			if [ -z "$BRANCH_NAME" ]; then
				BRANCH_NAME=$CURRENT_BRANCH
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


while getopts g:t:b: option; do
	case "${option}" in
		g)
			GROUP_NAME=${OPTARG}
			echo "GROUP_NAME: ${GROUP_NAME}"
			;;
		t)
			TOKEN=${OPTARG}
			echo "TOKEN: ${TOKEN}"
			;;
		b)
			BRANCH_NAME=${OPTARG}
			echo "BRANCH_NAME: ${BRANCH_NAME}"
			;;
		\? )
			echo "Invalid Option: -$OPTARG" 1>&2
			exit 1
			;;
		*)
			usage
			;;
	esac
done

opts_array=(GROUP_NAME TOKEN BRANCH_NAME)

echo "!!!!!!!!!!!"
validate_input
echo "!!!!!!!!!!!"
send_travis_api_request

echo $response
echo response

# Make sure we don't have uncommitted changes.
# if [[ -n $( git status -s --porcelain ) ]]; then
# 	echo "Uncommitted changes found."
# 	echo "Please deal with them and try again clean."
# 	exit 1
# fi


# # Check the command
# if [[ 'new' == $COMMAND || '-n' == $COMMAND ]]; then
# 	echo "WHATEWER!!"
# elif [[ 'update' = $COMMAND || '-u' = $COMMAND ]]; then
# 	# It's possible they passed the branch name directly to the script
# 	if [[ -z $2 ]]; then
# 		read -p "What branch are you updating? (enter full branch name): " branch
# 		UPDATE_BUILT_BRANCH=$branch
# 	else
# 		UPDATE_BUILT_BRANCH=$2
# 	fi
# elif [[ '-h' = $COMMAND ]]; then
# 	usage
# else
# 	usage
# fi
