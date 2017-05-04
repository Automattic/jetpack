#!/bin/sh

# accepts: partner client ID and secret key
# executes wp-cli command to provision Jetpack site for given partner

PHP_PROVISION_SCRIPT="./partner-provision-wp.php";
# PHP_PROVISION_SCRIPT="wp jetpack partner-provision";

function usage
{
    echo "Usage: partner-provision.sh --partner_id=partner_id --partner_secret=partner_secret --plan=plan_name"
}

for i in "$@"; do
    key="$1"
    echo $i
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
        -h | --help )               usage
                                    exit
                                    ;;
        * )                         usage
                                    exit 1
    esac
    shift
done

if [ "$CLIENT_ID" = "" ] || [ "$CLIENT_SECRET" = "" ] || [ "$PLAN_NAME" = "" ]; then
    usage
    exit
fi

echo "Success - client = $CLIENT_ID, secret = $CLIENT_SECRET, plan = $PLAN_NAME";

ACCESS_TOKEN_JSON=`curl https://public-api.wordpress.com/oauth2/token --silent -d "grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&scope=jetpack-partner"`

echo $ACCESS_TOKEN_JSON

php $PHP_PROVISION_SCRIPT $( printf "%q" $ACCESS_TOKEN_JSON ) $PLAN_NAME

# TODO: 
# - execute wp-cli script to provision site and plan
# - pass back any errors, or if successful a "next" URL for the user to finish provisioning their plan

