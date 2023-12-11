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

	# Generic directories for later-version compat code.
	if php -r 'exit( PHP_VERSION_ID < 80000 ? 0 : 1 );'; then
		SKIPS+=( -o -name php8 )
	fi

	# Read `.require.php` from composer.json.
	while IFS=$'\t' read -r FILE OP VER; do
		if ! php -r 'exit( version_compare( PHP_VERSION, $argv[2], $argv[1] ) ? 0 : 1 );' "$OP" "$VER"; then
			SKIPS+=( -o -path "${FILE%/composer.json}" )
		fi
	done < <( jq -r '.require.php // "" | capture( "^(?<op>>=)(?<ver>[0-9][0-9.]*)$" ) | [ input_filename, .op, .ver ] | @tsv' ./projects/*/*/composer.json )

	# Plugins requirng PHP 7.4 or later.
	# @todo Add `.require.php` in their composer.json and remove this.
	if php -r 'exit( PHP_VERSION_ID < 70400 ? 0 : 1 );'; then
		SKIPS+=( -o -path ./projects/plugins/inspect )
		SKIPS+=( -o -path ./projects/plugins/crm )
	fi

	find . \( \
		-name .git \
		-o -name vendor \
		-o -name jetpack_vendor \
		-o -name wordpress \
		-o -name wordpress-develop \
		-o -name node_modules \
		-o -path ./tools/docker/data \
		"${SKIPS[@]}" \
	\) -prune -o -name '*.php' -print | vendor/bin/parallel-lint --stdin "${ARGS[@]}"
else
	exec vendor/bin/parallel-lint "${ARGS[@]}"
fi
