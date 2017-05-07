#!/usr/bin/env sh

# accepts: partner client ID and secret key
# executes wp-cli command to provision Jetpack site for given partner

# change to script directory so that wp finds the wordpress install part for this Jetpack instance
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
cd $SCRIPT_DIR

usage () {
    echo "Usage: partner-provision.sh --partner_id=partner_id --partner_secret=partner_secret --plan=plan_name [--site_url=http://example.com]"
}

for i in "$@"; do
    key="$1"
    case $i in
        -c=* | --partner_id=* )     CLIENT_ID="${i#*=}"
                                    shift
                                    ;;
        -s=* | --partner_secret=* ) CLIENT_SECRET="${i#*=}"
                                    shift
                                    ;;
        -p=* | --plan=* )           PLAN_NAME="${i#*=}"
                                    shift
                                    ;;
        -u=* | --site_url=* )       SITE_URL="${i#*=}"
                                    shift
                                    ;;
        -h | --help )               usage
                                    exit
                                    ;;
        * )                         usage
                                    exit 1
    esac
done

if [ "$CLIENT_ID" = "" ] || [ "$CLIENT_SECRET" = "" ] || [ "$PLAN_NAME" = "" ]; then
    usage
    exit 1
fi

# default API host that can be overridden
if [ -z "$JETPACK_START_API_HOST" ]; then
    JETPACK_START_API_HOST='public-api.wordpress.com'
fi 

# fetch an access token using our client ID/secret
ACCESS_TOKEN_JSON=`curl https://$JETPACK_START_API_HOST/oauth2/token --silent --header "Host: public-api.wordpress.com" -d "grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&scope=jetpack-partner"`

wp jetpack partner_provision "$ACCESS_TOKEN_JSON" --user_id=1 --plan=$PLAN_NAME --site_url=$SITE_URL

# TODO: 
# - execute wp-cli script to provision site and plan
# - pass back any errors, or if successful a "next" URL for the user to finish provisioning their plan

