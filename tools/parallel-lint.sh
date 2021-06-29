#!/bin/bash

set -eo pipefail

ARGS=()
ALL=true
while [[ $# -gt 0 ]]; do
	arg="$1"
	shift
	case $arg in
		--files)
			ALL=false
			;;
		--stdin)
			# I guess someone is planning to pipe files to us?
			ALL=false
			ARGS+=( "$arg" )
			;;
		*)
			ARGS+=( "$arg" )
			;;
	esac
done

if $ALL; then
	find . \( \
		-name .git \
		-o -name vendor \
		-o -name wordpress \
		-o -name wordpress-develop \
		-o -name node_modules \
	\) -prune -o -name '*.php' -print | vendor/bin/parallel-lint --stdin "${ARGS[@]}"
else
	exec vendor/bin/parallel-lint "${ARGS[@]}"
fi
