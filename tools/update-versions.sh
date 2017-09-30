#!/bin/sh
NEW_VERSION="$1"


# For example if called with 4.5-beta as first argument, will output 4.5.0-beta
# Useful for updating package.json's semver-based version field
version_to_semver() {
	version=''
	# If this is a point release, output the number as is as it's compliant with semver notation
	if [ `echo $1 | awk -F. '{ print NF - 1 }'` -eq 2 ]; then
		version=$NEW_VERSION
	else
		# Get version number
		v=`echo "$NEW_VERSION" | awk -F'-' '{print $1}'`
		# Get alpha/beta string
		v2=`echo "$NEW_VERSION" | awk -F'-' '{print $2}'`
		# Join'em
		if [ $v2 ]; then v2="-$v2";fi
		version="$v.0$v2"
	fi
	echo $version
}

[ $# -eq 0 ] && echo "Please provide a release number as first argument" && exit 1

# UPDATE jetpack.php header
sed -i .bak "s/* Version:.*/* Version: $NEW_VERSION/" jetpack.php
mv jetpack.php.bak /tmp

#UPDATE package.json
NEW_PACKAGE_JSON_VERSION=`version_to_semver $NEW_VERSION`
sed -i .bak "s/  \"version\": .*/  \"version\": \"$NEW_PACKAGE_JSON_VERSION\",/" package.json
mv package.json.bak /tmp


