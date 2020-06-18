#!/usr/bin/env bash

# CAUTION!
# This script does one thing, which is to revert stable tag in WordPress.org svn to the prior tag.
# It should only be used in extreme emergency cases.

# Check for requirements. Using `jq` to easily parse json. Is there a simpler way to get the latest tags?
if [ -z $(command -v jq) ]; then
	echo "This script requires the jq library."
	read -p "Do you want to install it on your system with Homebrew? [y/N]" -n 1 -r
	if [[ $REPLY != "y" && $REPLY != "Y" ]]; then
		exit 1;
	else
		brew install jq 2>/dev/null
		echo "Done! You can now run the script again to start the revert."
		exit 1;
	fi
fi

YELLOW='\033[1;33m'
RED='\033[0;31m'
NOCOLOR='\033[0m'

# Current stable version
CURRENT_STABLE_VERSION=$(curl -s http://api.wordpress.org/plugins/info/1.0/jetpack.json | jq -r .version)

# Get all versions, strip anything with alpha characters such as -beta or trunk.
LAST_STABLE_TAG=$(curl -s http://api.wordpress.org/plugins/info/1.0/jetpack.json | jq -r '.versions | delpaths([paths | select(.[] | test("[A-Za-z]+"; "i"))]) | keys[-2]' )

echo -e "${RED}CAUTION${NOCOLOR}"
echo -e "This script does one thing, which is to revert stable tag in WordPress.org svn to the prior tag."
echo -e "It should only be used in extreme emergency cases."
echo ""
echo -e "${YELLOW}Current stable tag:${NOCOLOR} ${CURRENT_STABLE_VERSION}"
echo -e "${YELLOW}Revert to tag:${NOCOLOR} ${LAST_STABLE_TAG}"

read -p "Continue? [y/N]" -n 1 -r
if [[ $REPLY != "y" && $REPLY != "Y" ]]; then
    exit 1;
fi
echo ""

JETPACK_SVN_DIR="/tmp/jetpack-revert"

# Prep a home to drop our new files in. Just make it in /tmp so we can start fresh each time.
rm -rf $JETPACK_SVN_DIR

echo "Checking out SVN shallowly to $JETPACK_SVN_DIR"
svn -q checkout https://plugins.svn.wordpress.org/jetpack/ --depth=empty $JETPACK_SVN_DIR
echo "Done!"

cd $JETPACK_SVN_DIR

echo "Checking out SVN trunk to $JETPACK_SVN_DIR/trunk"
svn -q up trunk
echo "Done!"

# Update trunk to point to the last stable tag.
echo "Modifying 'Stable tag:' value in trunk readme.txt"
perl -pi -e "s/Stable tag: .*/Stable tag: $LAST_STABLE_TAG/" trunk/readme.txt
echo ""
echo -e "${YELLOW}The diff you are about to commit:${NOCOLOR}"
svn diff


echo ""
echo -e "${RED}WARNING:${NOCOLOR} "
read -p "You are about to revert the stable tag for Jetpack via the diff above. Would you like to commit it now? [y/N]" -n 1 -r
if [[ $REPLY != "y" && $REPLY != "Y" ]]; then
    exit 1;
else
    svn ci -m "Revert stable tag"
fi
