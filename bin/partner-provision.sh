#!/usr/bin/env sh

# accepts: partner client ID and secret key, and some site info
# executes wp-cli command to provision Jetpack site for given partner

usage () {
	echo "Usage: partner-provision.sh --partner_id=partner_id --partner_secret=partner_secret --user=wp_user_id [--plan=plan_name] [--onboarding=1] [--wpcom_user_id=1234] [--wpcom_user_email=wpcom_user_email] [--url=http://example.com] [--force_connect=1] [--force_register=1] [--allow-root] [--home_url] [--site_url] [--partner-tracking-id]"
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
		--site_url=* )              WP_SITEURL="${i#*=}"
			shift
			;;
		--home_url=* )              WP_HOME="${i#*=}"
			shift
			;;
		--partner-tracking-id=* )   PARTNER_TRACKING_ID="${i#*=}"
			shift
			;;
		--allow-root )              GLOBAL_ARGS="--allow-root"
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

# default API host that can be overridden
if [ -z "$JETPACK_START_API_HOST" ]; then
	JETPACK_START_API_HOST='public-api.wordpress.com'
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

# add extra args if available
if [ ! -z "$WP_USER" ]; then
	GLOBAL_ARGS="$GLOBAL_ARGS --user=$WP_USER"
fi

# set URL arg for multisite compatibility
if [ ! -z "$SITE_URL" ]; then
	GLOBAL_ARGS="$GLOBAL_ARGS --url=$SITE_URL"
fi

# Remove leading whitespace
GLOBAL_ARGS=$(echo "$GLOBAL_ARGS" | xargs echo)

# Silently ensure Jetpack is active
# Intentionally not quoting $GLOBAL_ARGS so that words in the string are split
wp $GLOBAL_ARGS plugin activate jetpack >/dev/null 2>&1

ADDITIONAL_ARGS=""
if [ ! -z "$ONBOARDING" ]; then
	ADDITIONAL_ARGS="$ADDITIONAL_ARGS --onboarding=$ONBOARDING"
fi

if [ ! -z "$PLAN_NAME" ]; then
	ADDITIONAL_ARGS="$ADDITIONAL_ARGS --plan=$PLAN_NAME"
fi

if [ ! -z "$WPCOM_USER_ID" ]; then
	ADDITIONAL_ARGS="$ADDITIONAL_ARGS --wpcom_user_id=$WPCOM_USER_ID"
fi

if [ ! -z "$WPCOM_USER_EMAIL" ]; then
	ADDITIONAL_ARGS="$ADDITIONAL_ARGS --wpcom_user_email=$WPCOM_USER_EMAIL"
fi

if [ ! -z "$FORCE_REGISTER" ]; then
	ADDITIONAL_ARGS="$ADDITIONAL_ARGS --force_register=$FORCE_REGISTER"
fi

if [ ! -z "$FORCE_CONNECT" ]; then
	ADDITIONAL_ARGS="$ADDITIONAL_ARGS --force_connect=$FORCE_CONNECT"
fi

if [ ! -z "$WP_SITEURL" ]; then
	ADDITIONAL_ARGS="$ADDITIONAL_ARGS --site_url=$WP_SITEURL"
fi

if [ ! -z "$WP_HOME" ]; then
	ADDITIONAL_ARGS="$ADDITIONAL_ARGS --home_url=$WP_HOME"
fi

if [ ! -z "$PARTNER_TRACKING_ID" ]; then
	ADDITIONAL_ARGS="$ADDITIONAL_ARGS --partner-tracking-id=$PARTNER_TRACKING_ID"
fi

# Remove leading whitespace
ADDITIONAL_ARGS=$(echo "$ADDITIONAL_ARGS" | xargs echo)

# Make request to /jpphp/provision here

# If request has access token, set it

# Echo JSON object, optionally only echoing next_url
