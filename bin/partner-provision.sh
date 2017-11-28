#!/usr/bin/env sh

# accepts: partner client ID and secret key, and some site info
# executes wp-cli command to provision Jetpack site for given partner

usage () {
	echo "Usage: partner-provision.sh --partner_id=partner_id --partner_secret=partner_secret [--user=wp_user_id] [--plan=plan_name] [--onboarding=1] [--wpcom_user_id=1234] [--url=http://example.com] [--force_connect=1] [--force_register=1] [--allow-root] [--home_url] [--site_url]"
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

if [ "$CLIENT_ID" = "" ] || [ "$CLIENT_SECRET" = "" ]; then
	usage
	exit 1
fi

# default API host that can be overridden
if [ -z "$JETPACK_START_API_HOST" ]; then
	JETPACK_START_API_HOST='public-api.wordpress.com'
fi

# fetch an access token using our client ID/secret
ACCESS_TOKEN_JSON=$(curl https://$JETPACK_START_API_HOST/oauth2/token --silent --header "Host: public-api.wordpress.com" -d "grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&scope=jetpack-partner")

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

# Remove leading whitespace
ADDITIONAL_ARGS=$(echo "$ADDITIONAL_ARGS" | xargs echo)

# Provision the partner plan
# Intentionally not quoting $GLOBAL_ARGS or $ADDITIONAL_ARGS so that words in the strings are split
wp $GLOBAL_ARGS jetpack partner_provision "$ACCESS_TOKEN_JSON" $ADDITIONAL_ARGS
