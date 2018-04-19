#!/usr/bin/env sh

# accepts: partner client ID and secret key, and some site info
# executes wp-cli command to provision Jetpack site for given partner

usage () {
	echo 'Usage: partner-provision.sh \
	--partner_id=partner_id \
	--partner_secret=partner_secret \
	--user=wp_user_id \
	[--wp-cli-path=/usr/local/bin/wp]
	[--plan=plan_name] \
	[--onboarding=1] \
	[--wpcom_user_id=1234] \
	[--wpcom_user_email=wpcom_user_email] \
	[--url=http://example.com] \
	[--force_connect=1] \
	[--force_register=1] \
	[--allow-root] \
	[--partner-tracking-id=1]'
}

WP_CLI_PATH="wp"
PROVISION_REQUEST_ARGS=""
GLOBAL_ARGS="--skip-themes --skip-plugins=$($WP_CLI_PATH plugin list --field=name | grep -v ^jetpack$ | tr  '\n' ',')"

# Default API host that can be overridden.
if [ -z "$JETPACK_START_API_HOST" ]; then
	JETPACK_START_API_HOST='public-api.wordpress.com'
fi
PROVISION_REQUEST_URL="https://$JETPACK_START_API_HOST/rest/v1.3/jpphp/provision"

for i in "$@"; do
	case $i in
		-c=* | --partner_id=* )
			CLIENT_ID="${i#*=}"
			shift
			;;
		-s=* | --partner_secret=* )
			CLIENT_SECRET="${i#*=}"
			shift
			;;
		-i=* | --user_id=* | --user=* )
			WP_USER="${i#*=}"
			GLOBAL_ARGS="$GLOBAL_ARGS --user=${i#*=}"
			shift
			;;
		-w=* | --wpcom_user_id=* )
			PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form wpcom_user_id=${i#*=}"
			shift
			;;
		-e=* | --wpcom_user_email=* )
			PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form wpcom_user_email=${i#*=}"
			shift
			;;
		-p=* | --plan=* )
			PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form plan=${i#*=}"
			shift
			;;
		-o=* | --onboarding=* )
			PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form onboarding=${i#*=}"
			shift
			;;
		-u=* | --url=* )
			GLOBAL_ARGS="$GLOBAL_ARGS --url=${i#*=}"
			shift
			;;
		--force_register=* )
			PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form force_register=${i#*=}"
			shift
			;;
		--force_connect=* )
			PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form force_connect=${i#*=}"
			shift
			;;
		--partner-tracking-id=* )
			PROVISION_REQUEST_URL="$PROVISION_REQUEST_URL?partner-tracking-id=${i#*=}"
			shift
			;;
		--allow-root )
			GLOBAL_ARGS="--allow-root"
			shift
			;;
		--wp-cli-path=* )
			WP_CLI_PATH="${i#*=}"
			shift
			;;
		-h | --help )
			usage
			exit
			;;
		* )
			echo $(usage) >&2
			exit 1
	esac
done

if [ "$CLIENT_ID" = "" ] || [ "$CLIENT_SECRET" = "" ] || [ "$WP_USER" = "" ]; then
	echo $(usage) >&2
	exit 1
fi

jetpack_shell_is_errored() {
	if [ -z "$1" ]; then
		exit 1
	fi

	JSON_ERROR=$( jetpack_echo_key_from_json "$1" error | xargs echo )

	if [ -z "$JSON_ERROR" ]; then
		return 1
	else
		return 0
	fi
}

jetpack_is_wp_cli_error() {
	if [ -z "$1" ]; then
		exit 1
	fi

	if [ ! -z $( echo "$1" | grep Error:) ] || [ -z "$1" ]; then
		return 0
	fi

	return 1
}

jetpack_echo_key_from_json() {
	if [ -z "$1" ]; then
		exit 1
	fi

	echo $1 | sed -n "s/.*\"$2\":\"\([^\"]*\)\",.*/\1/p"
}

# Fetch an access token using our client ID/secret.
ACCESS_TOKEN_JSON=$(
	curl \
		--silent \
		--request POST \
		--url https://public-api.wordpress.com/oauth2/token \
		--header 'cache-control: no-cache' \
		--header 'content-type: multipart/form-data;' \
		--form client_id="$CLIENT_ID" \
		--form client_secret="$CLIENT_SECRET" \
		--form grant_type=client_credentials \
		--form scope=jetpack-partner
)

if jetpack_shell_is_errored "$ACCESS_TOKEN_JSON"; then
	echo "$ACCESS_TOKEN_JSON" >&2
	exit 1
fi

ACCESS_TOKEN=$( jetpack_echo_key_from_json "$ACCESS_TOKEN_JSON" access_token | xargs echo )

# If we don't have an access token, we can't go further.
if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "" ]; then
	echo "$ACCESS_TOKEN_JSON" >&2
	exit 1
fi

# Silently ensure Jetpack is active
# Intentionally not quoting $GLOBAL_ARGS so that words in the string are split
$WP_CLI_PATH $GLOBAL_ARGS plugin activate jetpack >/dev/null 2>&1

SITEURL=$( $WP_CLI_PATH $GLOBAL_ARGS option get siteurl | xargs echo )
PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form siteurl=$SITEURL"

LOCAL_USERNAME=$( $WP_CLI_PATH $GLOBAL_ARGS user get "$WP_USER" --field=login | xargs echo )
PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form local_username=$LOCAL_USERNAME"

PROVISION_REQUEST=$(
	curl \
		--silent \
		--request POST \
		--url "$PROVISION_REQUEST_URL" \
		--header "authorization: Bearer $ACCESS_TOKEN" \
		--header 'cache-control: no-cache' \
		--header 'content-type: multipart/form-data;' \
		$PROVISION_REQUEST_ARGS
)

if jetpack_shell_is_errored "$PROVISION_REQUEST"; then
	echo "$PROVISION_REQUEST" >&2
	exit 1
fi

# Get the access token for the Jetpack connection.
ACCESS_TOKEN=$( jetpack_echo_key_from_json "$PROVISION_REQUEST" access_token | xargs echo )

# If we have an access token, set it and activate default modules!
if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "" ] && [ ! -z "$WPCOM_USER_ID" ]; then
	AUTHORIZE_RESULT=$( $WP_CLI_PATH $GLOBAL_ARGS jetpack authorize_user --token="$ACCESS_TOKEN" )
	if jetpack_is_wp_cli_error "$AUTHORIZE_RESULT"; then
		echo "{\"success\":false,\"error_code\":\"authorization_failure\",\"error_message\":\"$AUTHORIZE_RESULT\"}" >&2
		exit 1
	fi
fi

echo "$PROVISION_REQUEST"
exit 0
