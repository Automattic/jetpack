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
	SKIPS=()
	if php -r 'exit( PHP_VERSION_ID < 70000 ? 0 : 1 );'; then
		SKIPS+=( -o -name php7 )
	fi
	if php -r 'exit( PHP_VERSION_ID < 80000 ? 0 : 1 );'; then
		SKIPS+=( -o -name php8 )
	fi

	find . \( \
		-name .git \
		-o -name vendor \
		-o -name jetpack_vendor \
		-o -name wordpress \
		-o -name wordpress-develop \
		-o -name node_modules \
		"${SKIPS[@]}" \
	\) -prune -o -name '*.php' -print | vendor/bin/parallel-lint --stdin "${ARGS[@]}"
else
	exec vendor/bin/parallel-lint "${ARGS[@]}"
fi
