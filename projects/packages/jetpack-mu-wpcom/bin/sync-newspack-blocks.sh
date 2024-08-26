#!/usr/bin/env bash

# sed -i behaves differently between macos and linux platforms.
# See https://stackoverflow.com/a/51060063
# To use this, do `sed "${sedi[@]}" -e $sed_expression`
sedi=(-i)
# macOS version of sed doesn't support `--version` param and exits with code 1
sed --version > /dev/null 2>&1
if [ $? -eq 1 ]
then
	# For macOS, use two parameters
	sedi=(-i "")
fi

# pick up value considering that the argument
# has the --key=value shape.
key_value=$(echo ${1} | cut -d'=' -f 2)
# Set mode depending on first argument
if [[ $1 =~ ^--release= ]]
then
	MODE=release
	NAME=${key_value}
	URL=https://github.com/Automattic/newspack-blocks/releases/download/$NAME/newspack-blocks.zip
elif [[ $1 =~ ^--branch= ]]
then
	MODE=branch
	NAME=${key_value}
	URL=https://github.com/Automattic/newspack-blocks/archive/$NAME.zip
elif [[ $1 =~ ^--path= ]]
then
	MODE=path
elif [[ $1 =~ ^--nodemodules ]]
# try whether user passed --nodemodules
then
	MODE=npm
fi

# print usage is no mode matched
if [ -z "$MODE" ]
then
    echo "Usage: pnpm run sync:newspack-blocks [arguments]"
    echo
    echo Possible arguments:
    echo --branch=master
    echo "--nodemodules (to use defined in package.json)"
    echo "--path=/path/to/newspack-blocks"
    echo --release=v2.0.0
    echo
    echo You can find the latest release ID on https://github.com/Automattic/newspack-blocks/releases/latest
    echo
    exit 1
fi

TARGET=./src/features/newspack-blocks/synced-newspack-blocks
ENTRY=./src/features/newspack-blocks/index.php

if [[ ( "$MODE" != "path" ) && ( "$MODE" != "npm" ) ]];
then
	# return early if the version is the same
	if [ -f $TARGET/package.json ]; then
		CURRENT_VERSION=v`jq -r .version $TARGET/package.json`

		if [[ "$CURRENT_VERSION" == "$NAME" ]]; then
			echo "The current version $CURRENT_VERSION of the newspack-blocks is synced."
			exit 0
		fi
	fi

	# make a temp directory
	TEMP_DIR=`mktemp -d`
	CODE=$TEMP_DIR/code

	# download zip file
	echo Downloading $MODE $NAME into $TEMP_DIR
	(cd $TEMP_DIR && curl -L --fail -s -O $URL)

	# handle download error
	ZIPS=( $TEMP_DIR/*.zip )
	ZIP=${ZIPS[0]}
	if [ ! -f "$ZIP" ]; then
		echo "Tried to download $URL"
		echo
		echo "Error: Could not download the zip file."
		if [ "$MODE" = 'release' ]; then
			echo Is the release ID correct? Does the release contain artifact newspack-blocks.zip?
		else
			echo Is the branch name correct?
		fi
		exit 1
	fi

	# extract zip
	echo Extracting into $CODE
	mkdir -p $CODE
	unzip -q $ZIP -d $CODE

	# find the main file and use its directory as the root of our source dir
	MAIN_FILE=`find $CODE -name "newspack-blocks.php"`
	CODE=`dirname $MAIN_FILE`

	# handle unzip error
	if [ ! -f "$CODE/newspack-blocks.php" ]; then
		echo
		echo "Error: Could not extract files from newspack-blocks.zip"
		exit 1
	fi
elif [ "$MODE" = "path" ] ; then
	CODE=${key_value}
elif [ "$MODE" = "npm" ] ; then
	# Way back to wp-calypso root:
	CODE="../../node_modules/@automattic/newspack-blocks"
fi

if [ ! -d "$CODE" ] ; then
	echo "Nothing at the specified path to the code ($CODE)."
	exit 1
fi

echo Syncing files to jetpack-mu-wpcom...

# Remove the target dir so that we start on a clean slate.
rm -rf "$TARGET"

# ensure target dirs exist
mkdir -p $TARGET/blocks
mkdir -p $TARGET/components
mkdir -p $TARGET/shared
mkdir -p $TARGET/types

# copy files and directories
cp $CODE/package.json $TARGET/
cp $CODE/includes/class-newspack-blocks-api.php $TARGET/
cp $CODE/includes/class-newspack-blocks.php $TARGET/
cp -R $CODE/src/blocks/homepage-articles $TARGET/blocks/
cp -R $CODE/src/blocks/carousel $TARGET/blocks/
cp -R $CODE/src/shared $TARGET/
cp -R $CODE/src/components $TARGET/

# Get Typescript working by copying the main type defs over.
cp $CODE/src/types/index.d.ts $TARGET/types/
# Function types need to be capitalized in our system. We only match " function"
# beginning with a space to avoid matching it as a substring. (Not perfect, but
# imperfections will be caught by CI with failing tsc, etc.)
sed "${sedi[@]}" -e "s| function| Function|g" "$TARGET/types/index.d.ts"

# Note: I would have used eslint-nibble, but it doesn't support autofixing via the CLI.
echo "Changing JS textdomain to match jetpack-mu-wpcom..."
pnpm --package=eslint@8.57.0 dlx eslint --no-ignore --rule '"@wordpress/i18n-text-domain":["error",{"allowedTextDomain":"jetpack-mu-wpcom"}]' --fix $TARGET > /dev/null

echo "Changing JS translation function call to avoid bad minification..."
pnpm --package=jscodeshift dlx jscodeshift -t ./bin/sync-newspack-blocks-formatter.js --extensions=js $TARGET

echo "Changing PHP textdomain to match jetpack-mu-wpcom..."
../../../vendor/bin/phpcbf --standard=./.phpcs.dir.xml --filter=../../../vendor/automattic/jetpack-phpcs-filter/src/PhpcsFilter.php --runtime-set jetpack-filter-no-ignore -q $TARGET

echo Sync done.
