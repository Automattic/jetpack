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
    --no-single-branch \
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

# Checking for composer
hash composer 2>/dev/null || {
    echo >&2 "This script requires you to have composer package manager installed."
    echo >&2 "Please install it following the instructions on https://getcomposer.org/. Aborting.";
    exit 1;
}

# Hack-ish way to resolve problem with nvm being not available in script context
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

# Using the version of Node that is required in .nvmrc
nvm install && nvm use || {
    echo >&2 "This script requires a certain Node version."
    echo >&2 "We could not use the Node version that is specified in the .nvmrc file."
    exit 1;
}

# Checking for yarn
hash yarn 2>/dev/null || {
    echo >&2 "This script requires you to have yarn package manager installed."
    echo >&2 "Please install it following the instructions on https://yarnpkg.com. Aborting.";
    exit 1;
}
yarn --cwd $TARGET_DIR cache clean
yarn --cwd $TARGET_DIR run build-production-concurrently

echo "Purging paths included in .svnignore, .gitignore and .git itself"
# check .svnignore
for file in $( cat "$TARGET_DIR/.svnignore" 2>/dev/null ); do
    if [[ $file == "to-test.md" || $file == "docs/testing/testing-tips.md" ]]; then
        continue
    fi
    rm -rf $TARGET_DIR/$file
done
echo "Done!"
