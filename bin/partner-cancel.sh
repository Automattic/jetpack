#!/usr/bin/env sh

# cancel a the plan provided for the current site using the given partner keys

# change to script directory so that wp finds the wordpress install part for this Jetpack instance
SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd -P)
cd "$SCRIPT_DIR" || exit

usage () {
    echo "Usage: partner-cancel.sh --partner_id=partner_id --partner_secret=partner_secret [--url=http://example.com]"
}

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

# silently ensure Jetpack is active
wp plugin activate jetpack --url="$SITE_URL" >/dev/null 2>&1

# cancel the partner plan
wp jetpack partner_cancel "$ACCESS_TOKEN_JSON" --url="$SITE_URL"

