#!/usr/bin/env sh

SANDBOX_ROOT=$1

if [ -z "$SANDBOX_ROOT" ]
then
	echo "Usage:"
	echo "./bin/sync-blocks-sandbox.sh path/to/your/sandbox"
	exit;
fi

SANDBOX_JETPACK=$SANDBOX_ROOT/wp-content/mu-plugins/jetpack

echo "Copying to $SANDBOX_JETPACK"

rsync -a --delete extensions/ $SANDBOX_JETPACK/extensions/

cp package.json $SANDBOX_JETPACK
cp yarn.lock $SANDBOX_JETPACK
cp webpack.config.extensions.js $SANDBOX_JETPACK
cp babel.config.extensions.js $SANDBOX_JETPACK

echo "Done!"
