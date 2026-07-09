#!/usr/bin/env bash
if [[ -z "$1" ]]; then
	echo 'Usage: update-core.sh [<version>]'
	exit 1
fi

TARGET_VERSION="$1"
INIT_CORE_VERSION=$(wp core version)

if [[ "$TARGET_VERSION" == 'latest' ]]; then
	TARGET_VERSION=$(wp core check-update --field=version|tail -n1)
	# We're already on the latest version.
	if [[ "$TARGET_VERSION" == Success:* ]]; then
		TARGET_VERSION=$INIT_CORE_VERSION
	fi
fi

# WordPress versioning has no minor 0 version.
if [[ "$TARGET_VERSION" =~ ^([0-9]+)\.([0-9]+)\.0$ ]]; then
	TARGET_VERSION="${TARGET_VERSION%.0}"
fi

echo "Current version: $INIT_CORE_VERSION"
echo "Target version: $TARGET_VERSION"

if [[ "$TARGET_VERSION" == "$INIT_CORE_VERSION" ]]; then
	echo 'Already on requested version, but forcing update.'
fi
echo "Updating WordPress core to $TARGET_VERSION..."
echo "Please be patient; this may take some time."

# Clean up old option if a previous update didn't complete. Otherwise one would get this:
# "Error: Another update is currently in progress."
wp option get core_updater.lock &>/dev/null && wp option delete core_updater.lock

wp core update --version="$TARGET_VERSION" --force

# If these don't match now, it means something went wrong with the update.
if [[ "$TARGET_VERSION" != "$(wp core version)" ]]; then
	echo "WordPress update to $TARGET_VERSION failed!"
	exit 1
fi

# Update database.
echo 'Updating core database.'
wp core update-db

echo "Successfully updated WordPress from $INIT_CORE_VERSION to $TARGET_VERSION."
