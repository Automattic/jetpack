#!/bin/bash

DIR=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)

if [[ -n "$NODE_PATH" ]]; then
	export NODE_PATH="$NODE_PATH:$DIR/node_modules"
else
	export NODE_PATH="$DIR/node_modules"
fi

exec "$DIR/js-test-runner.js" "$@"
