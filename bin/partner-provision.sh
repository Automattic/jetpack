#!/bin/sh

# accepts: partner client ID and secret key
# executes wp-cli command to provision Jetpack site for given partner

function usage
{
    echo "Usage: partner-provision.sh --client_id=client_id --client_secret=client_secret --plan=plan_name"
}

for i in "$@"; do
    key="$1"
    echo $i
    case $i in
        -c=* | --client_id=* )      CLIENT_ID="${i#*=}"
                                    shift
                                    ;;
        -s=* | --client_secret=* )  CLIENT_SECRET="${i#*=}"
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