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

	# `tools/` and `.github/` only need to be compatibile with 8.2.
	# See also the `.phpcs.dir.xml` and `.phpcs.dir.phpcompatibility.xml` files in those dirs, and PHP_VERSION in .github/versions.sh.
	if php -r 'exit( PHP_VERSION_ID < 80200 ? 0 : 1 );'; then
		SKIPS+=( -o -path ./tools )
		SKIPS+=( -o -path ./.github )
	fi

	# Read `.require.php` from composer.json.
	while IFS=$'\t' read -r FILE OP VER; do
		if ! php -r 'exit( version_compare( PHP_VERSION, $argv[2], $argv[1] ) ? 0 : 1 );' "$OP" "$VER"; then
			SKIPS+=( -o -path "${FILE%/composer.json}" )
		fi
	done < <( jq -r '.require.php // "" | capture( "^(?<op>>=)(?<ver>[0-9][0-9.]*)$" ) | [ input_filename, .op, .ver ] | @tsv' ./projects/*/*/composer.json )

	find . \( \
		-name .git \
		-o -name vendor \
		-o -name jetpack_vendor \
		-o -name wordpress \
		-o -name wordpress-develop \
		-o -name node_modules \
		-o -path ./tools/docker/data \
		-o -path '*/.phan/stubs' \
		"${SKIPS[@]}" \
	\) -prune -o -name '*.php' -print | vendor/bin/parallel-lint --stdin "${ARGS[@]}"
else
	exec vendor/bin/parallel-lint "${ARGS[@]}"
fi
