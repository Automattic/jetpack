#!/bin/bash

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

GLOBAL_ARGS=""

for i in "$@"; do
	case $i in
		-c=* | --partner_id=* )     CLIENT_ID="${i#*=}"
			shift
			;;
		-s=* | --partner_secret=* ) CLIENT_SECRET="${i#*=}"
			shift
			;;
		-i=* | --user_id=* | --user=* ) WP_USER="${i#*=}"
			shift
			;;
		-w=* | --wpcom_user_id=* )  WPCOM_USER_ID="${i#*=}"
			shift
			;;
		-e=* | --wpcom_user_email=* ) WPCOM_USER_EMAIL="${i#*=}"
			shift
			;;
		-p=* | --plan=* )           PLAN_NAME="${i#*=}"
			shift
			;;
		-o=* | --onboarding=* )     ONBOARDING="${i#*=}"
			shift
			;;
		-u=* | --url=* )            SITE_URL="${i#*=}"
			shift
			;;
		--force_register=* )        FORCE_REGISTER="${i#*=}"
			shift
			;;
		--force_connect=* )         FORCE_CONNECT="${i#*=}"
			shift
			;;
		--partner-tracking-id=* )   PARTNER_TRACKING_ID="${i#*=}"
			shift
			;;
		--allow-root )              GLOBAL_ARGS="--allow-root"
			shift
			;;
		--wp-cli-path=* )           WP_CLI_PATH="${i#*=}"
			shift
			;;
		-h | --help )               usage
			exit
			;;
		* )                         usage
			exit 1
	esac
done

if [ "$CLIENT_ID" = "" ] || [ "$CLIENT_SECRET" = "" ] || [ "$WP_USER" = "" ]; then
	usage
	exit 1
fi

jetpack_shell_is_errored() {
	# Note that zero represents true below.
	PHP_IN="
		\$object = json_decode( '$1' );
		if ( ! \$object ) {
			return 1;
		}
		echo ! empty( \$object->error ) ? 0 : 1; exit;
	";

	return $( php -r "$PHP_IN" ) # TODO: Do we need to worry about word-splitting here?
}

jetpack_is_wp_cli_error() {
	if [ ! -z $( echo "$1" | grep Error:) ] || [ -z "$1" ]; then
		return 0
	fi

	return 1
}

jetpack_echo_key_from_json() {
	PHP_IN="
		\$object = json_decode( '$1' );
		if ( ! \$object ) {
			return 1;
		}
		echo ! empty( \$object->$2 ) ? \$object->$2 : ''; exit;

		if ( ! empty( \$object->$2 ) ) {
			echo \$object->$2;
		} else {
			echo '';
		}
		exit;
	";

	php -r "$PHP_IN"
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
	echo "$ACCESS_TOKEN_JSON"
	exit 1
fi

ACCESS_TOKEN=$( jetpack_echo_key_from_json "$ACCESS_TOKEN_JSON" access_token | xargs echo )

# If we don't have an access token, we can't go further.
if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "" ]; then
	echo "$ACCESS_TOKEN_JSON"
	exit 1
fi

if [ -z "$WP_CLI_PATH" ]; then
	WP_CLI_PATH="wp"
fi

# add extra args if available
if [ ! -z "$WP_USER" ]; then
	GLOBAL_ARGS="$GLOBAL_ARGS --user=$WP_USER"
fi

# set URL arg for multisite compatibility
if [ ! -z "$SITE_URL" ]; then
	GLOBAL_ARGS="$GLOBAL_ARGS --url=$SITE_URL"
fi

# Skip the theme and all plugins except Jetpack
GLOBAL_ARGS="$GLOBAL_ARGS --skip-themes --skip-plugins=$($WP_CLI_PATH plugin list --field=name | grep -v ^jetpack$ | tr  '\n' ',')"

# Remove leading whitespace
GLOBAL_ARGS=$(echo "$GLOBAL_ARGS" | xargs echo)

# Silently ensure Jetpack is active
# Intentionally not quoting $GLOBAL_ARGS so that words in the string are split
$WP_CLI_PATH $GLOBAL_ARGS plugin activate jetpack >/dev/null 2>&1

# Default API host that can be overridden.
if [ -z "$JETPACK_START_API_HOST" ]; then
	JETPACK_START_API_HOST='public-api.wordpress.com'
fi

PROVISION_REQUEST_URL="https://$JETPACK_START_API_HOST/rest/v1.3/jpphp/provision"
if [ ! -z "$PARTNER_TRACKING_ID" ]; then
	PROVISION_REQUEST_URL="$PROVISION_REQUEST_URL?partner-tracking-id=$PARTNER_TRACKING_ID"
fi

if [ ! -z "$ONBOARDING" ]; then
	PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form onboarding=$ONBOARDING"
fi

if [ ! -z "$PLAN_NAME" ]; then
	PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form plan=$PLAN_NAME"
fi

if [ ! -z "$WPCOM_USER_ID" ]; then
	PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form wpcom_user_id=$WPCOM_USER_ID"
fi

if [ ! -z "$WPCOM_USER_EMAIL" ]; then
	PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form wpcom_user_email=$WPCOM_USER_EMAIL"
fi

if [ ! -z "$FORCE_REGISTER" ]; then
	PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form force_register=$FORCE_REGISTER"
fi

if [ ! -z "$FORCE_CONNECT" ]; then
	PROVISION_REQUEST_ARGS="$PROVISION_REQUEST_ARGS --form force_connect=$FORCE_CONNECT"
fi

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
	echo "$PROVISION_REQUEST"
	exit 1
fi

# Get the access token for the Jetpack connection.
ACCESS_TOKEN=$( jetpack_echo_key_from_json "$PROVISION_REQUEST" access_token | xargs echo )

# If we have an access token, set it and activate default modules!
if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "" ] && [ ! -z "$WPCOM_USER_ID" ]; then
	AUTHORIZE_RESULT=$( $WP_CLI_PATH $GLOBAL_ARGS jetpack authorize_user --token="$ACCESS_TOKEN" )
	if jetpack_is_wp_cli_error "$AUTHORIZE_RESULT"; then
		echo "{\"success\":false,\"error_code\":\"authorization_failure\",\"error_message\":\"$AUTHORIZE_RESULT\"}"
		exit 1
	fi
fi

echo "$PROVISION_REQUEST"
exit 0
