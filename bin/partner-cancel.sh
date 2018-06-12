#!/usr/bin/env sh

# cancel a the plan provided for the current site using the given partner keys

usage () {
	echo "Usage: partner-cancel.sh --partner_id=partner_id --partner_secret=partner_secret [--url=http://example.com] [--allow-root] [--partner-tracking-id]"
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
		-u=* | --url=* )            SITE_URL="${i#*=}"
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

# set URL arg for multisite compatibility
if [ ! -z "$SITE_URL" ]; then
	GLOBAL_ARGS=" --url=$SITE_URL"
fi

ADDITIONAL_ARGS=""
if [ ! -z "$PARTNER_TRACKING_ID" ]; then
	ADDITIONAL_ARGS="$ADDITIONAL_ARGS --partner-tracking-id=$PARTNER_TRACKING_ID"
fi

# Remove leading whitespace
GLOBAL_ARGS=$(echo "$GLOBAL_ARGS" | xargs echo)

# Intentionally not quoting $GLOBAL_ARGS below so that words in the string are split

# silently ensure Jetpack is active
wp $GLOBAL_ARGS plugin activate jetpack >/dev/null 2>&1

# cancel the partner plan
wp $GLOBAL_ARGS jetpack partner_cancel "$ACCESS_TOKEN_JSON" $ADDITIONAL_ARGS
