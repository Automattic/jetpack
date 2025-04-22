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
key_value=$(echo "${1}" | cut -d'=' -f 2)
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
    echo --release=v4.0.0
    echo
    echo You can find the latest release ID on https://github.com/Automattic/newspack-blocks/releases/latest
    echo
    exit 1
fi

TARGET=./src/features/newspack-blocks/synced-newspack-blocks

if [[ ( "$MODE" != "path" ) && ( "$MODE" != "npm" ) ]];
then
	# return early if the version is the same
	if [ -f $TARGET/version.txt ]; then
		CURRENT_VERSION=$(< $TARGET/version.txt )

		if [[ "$CURRENT_VERSION" == "$NAME" ]]; then
			echo "The current version $CURRENT_VERSION of the newspack-blocks is synced."
			read -rp "Do you want to proceed anyway? (y/N): " proceed
			if [[ ! "$proceed" =~ ^[Yy]$ ]]; then
				exit 0
			fi
		fi
	fi

	# make a temp directory
	TEMP_DIR=$(mktemp -d)
	CODE=$TEMP_DIR/code

	# download zip file
	echo "Downloading $MODE $NAME into $TEMP_DIR"
	(cd "$TEMP_DIR" && curl -L --fail -s -O "$URL")

	# handle download error
	ZIPS=( "$TEMP_DIR"/*.zip )
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
	echo "Extracting into $CODE"
	mkdir -p "$CODE"
	unzip -q "$ZIP" -d "$CODE"

	# find the main file and use its directory as the root of our source dir
	MAIN_FILE=$(find "$CODE" -name "newspack-blocks.php")
	CODE=$(dirname "$MAIN_FILE")

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

# Update Newspack Blocks version number in the package.
NEW_VERSION=v$(jq -r .version "$CODE"/package.json)
echo "$NEW_VERSION" > $TARGET/version.txt
sed -E -i.bak "s|^define\( 'NEWSPACK_BLOCKS__VERSION', '.*' \);$|define( 'NEWSPACK_BLOCKS__VERSION', '$NEW_VERSION' );|" "$TARGET"/../index.php
rm "$TARGET"/../index.php.bak

# copy files and directories
cp "$CODE"/includes/class-newspack-blocks-api.php $TARGET/
cp "$CODE"/includes/class-newspack-blocks.php $TARGET/
cp -R "$CODE"/src/blocks/homepage-articles $TARGET/blocks/
cp -R "$CODE"/src/blocks/carousel $TARGET/blocks/
cp -R "$CODE"/src/shared $TARGET/
cp -R "$CODE"/src/components $TARGET/

# Get Typescript working by copying the main type defs over.
cp "$CODE"/src/types/index.d.ts $TARGET/types/
# Function types need to be capitalized in our system. We only match " function"
# beginning with a space to avoid matching it as a substring. (Not perfect, but
# imperfections will be caught by CI with failing tsc, etc.)
sed "${sedi[@]}" -e "s| function| Function|g" "$TARGET/types/index.d.ts"

# Note: I would have used eslint-nibble, but it doesn't support autofixing via the CLI.
echo "Changing JS textdomain to match jetpack-mu-wpcom..."
BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../../.. && pwd)
FULLTARGET="$PWD/$TARGET"

# Add a temporary single-rule eslint.config.mjs file.
cat > "$TARGET/eslint.config.mjs" <<EOF
import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

// This directory is copy-pasted from elsewhere, but we still need to run this one rule over it.
export default [
	// Import base config, but no rules.
	...makeBaseConfig( import.meta.url ).map( block => ( { ...block, rules: {} } ) ),
	// Enable just this one rule.
	{
		rules: {
			"@wordpress/i18n-text-domain": [ "error", { allowedTextDomain: "jetpack-mu-wpcom" } ],
		}
	},
];
EOF
( cd "$BASE" && pnpm run lint-file --no-inline-config --no-ignore --fix "$FULLTARGET" )
rm "$TARGET/eslint.config.mjs"

echo "Changing JS translation function call to avoid bad minification..."
pnpm --package=jscodeshift dlx jscodeshift -t ./bin/sync-newspack-blocks-formatter.js --extensions=js $TARGET

# Add temporary PHPCS config file.
PHPCSSTANDARDFILE="$TARGET/phpcs.tmp.xml"
cat > "$PHPCSSTANDARDFILE" <<EOF
<?xml version="1.0"?>
<ruleset>
	<rule ref="Jetpack.Functions.I18n">
		<properties>
			<property name="text_domain" value="jetpack-mu-wpcom" />
		</properties>
	</rule>

	<rule ref="WordPress.Utils.I18nTextDomainFixer">
		<properties>
			<property name="old_text_domain" type="array">
				<element value="newspack-blocks" />
			</property>
			<property name="new_text_domain" value="jetpack-mu-wpcom" />
		</properties>
	</rule>
</ruleset>
EOF
echo "Changing PHP textdomain to match jetpack-mu-wpcom..."
"$BASE"/vendor/bin/phpcbf --standard="$PHPCSSTANDARDFILE" "$TARGET"
rm "$PHPCSSTANDARDFILE"

# Add textdomain to block.json
echo "Adding textdomain to all block.json files..."
for block_json_file in "$TARGET"/blocks/*/block.json; do
	jq --tab '. += {"textdomain": "jetpack-mu-wpcom"}' "$block_json_file" > "$block_json_file.tmp" && mv "$block_json_file.tmp" "$block_json_file"
done
echo Sync done.
