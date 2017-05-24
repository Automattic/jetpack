#!/bin/bash
RED='\033[0;31m'
trap 'exit_build' ERR

function exit_build {
    echo -e "${RED}Something went wrong and the build has stopped.  See error above for more details."
    exit 1
}

# A POSIX variable
OPTIND=1         # Reset in case getopts has been used previously in the shell.

# Initialize our own variables:
CLEANUP=0
ADD_BETA_VERSION=0

while getopts "db" opt; do
    case "$opt" in
    d)  CLEANUP=1
        ;;
    b)  ADD_BETA_VERSION=1
        ;;
    esac
done

shift $((OPTIND-1))

GET_VERSION_SCRIPT="`pwd`/tools/get-version.sh"
TARGET_BRANCH=${1:-master}
TARGET_REPO=${2:-"Automattic/jetpack"}
TARGET_DIR=${3:-"/tmp/jetpack"}

[ "$1" = "--" ] && shift

if [[ $CLEANUP -eq 1 ]]; then
    echo "Cleaning up existing paths.."
    rm -rf $TARGET_DIR
    echo "Done!"
fi

git clone \
    --branch $TARGET_BRANCH \
    --depth 1000 \
    git://github.com/$TARGET_REPO.git \
    $TARGET_DIR

cd $TARGET_DIR

if [[ $ADD_BETA_VERSION -eq 1 ]]; then
    echo "Changing version of the Jetpack to reflect the latest changes.."
    CURRENT_VERSION="`$GET_VERSION_SCRIPT`"

    sed -i -e 's/Version: .*$/Version: '$CURRENT_VERSION'/' jetpack.php
    echo $CURRENT_VERSION > version.txt
    echo "Now at version $CURRENT_VERSION!"
fi

# Checking for yarn
hash yarn 2>/dev/null || {
    echo >&2 "This script requires you to have yarn package manager installed."
    echo >&2 "Please install it following the instructions on https://yarnpkg.com. Aborting.";
    exit 1;
}

yarn --modules-folder=$TARGET_DIR/node_modules
NODE_ENV=production BABEL_ENV=production $TARGET_DIR/node_modules/.bin/gulp

echo "Purging paths included in .svnignore, .gitignore and .git itself"
# check .svnignore
for file in $( cat "$TARGET_DIR/.svnignore" 2>/dev/null ); do
    if [[ $file == "to-test.md" || $file == "docs/testing/testing-tips.md" ]]; then
        continue
    fi
    rm -rf $TARGET_DIR/$file
done
echo "Done!"
