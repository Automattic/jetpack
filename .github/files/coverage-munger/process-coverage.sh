#!/bin/bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)

[[ -d coverage ]] && find coverage -type d -empty -delete
if [[ ! -d coverage ]]; then
	echo 'No coverage was generated.'
	exit 0
fi

echo '::group::Copy coverage into artifacts'
tar --owner=0 --group=0 --xz -cvvf artifacts/coverage.tar.xz coverage
echo '::endgroup::'

TMP_DIR=$( mktemp -d )
trap 'rm -rf "$TMP_DIR"' exit

TMP=$( find "$PWD/coverage" -name '*.cov' )
if [[ -n "$TMP" ]]; then
	echo "::group::Combining PHP coverage"
	composer --working-dir="$BASE" update
	"$BASE"/vendor/bin/phpcov merge --php artifacts/php-combined.cov coverage
	perl -i -pwe 'BEGIN { $prefix = shift; $prefix=~s!/*$!/!; $re = qr/\Q$prefix\E/; $l = length( $prefix ); } s!s:(\d+):"$re! sprintf( qq(s:%d:"), $1 - $l ) !ge' "$GITHUB_WORKSPACE" artifacts/php-combined.cov
	echo '::endgroup::'

	echo "::group::Creating PHP coverage summary"
	"$BASE"/extract-php-summary-data.php artifacts/php-combined.cov > "$TMP_DIR/php-summary.tsv"
	echo '::endgroup::'
else
	echo "No PHP coverage files found!"
	touch "$TMP_DIR/php-summary.tsv"
fi

TMP=$( find "$PWD/coverage" -name '*.json' )
if [[ -n "$TMP" ]]; then
	echo "::group::Combining JS coverage"

	# nyc needs all input files in a single directory, not in subdirs.
	mkdir "$TMP_DIR/jsraw"
	IDX=10000
	while IFS= read -r F; do
		cp "$F" "$TMP_DIR/jsraw/$(( IDX++ )).json"
	done < <( find "$PWD/coverage" -name '*.json' )

	pnpm --filter=./.github/files/coverage-munger/ exec nyc merge "$TMP_DIR/jsraw" "$PWD"/artifacts/js-combined.json
	perl -i -pwe 'BEGIN { $prefix = shift; $prefix=~s!/*$!/!; $re = qr/\Q$prefix\E/; } s!"$re!"!g' "$GITHUB_WORKSPACE" artifacts/js-combined.json
	echo '::endgroup::'

	echo "::group::Creating JS coverage summary"
	mkdir "$TMP_DIR/js"
	cp artifacts/js-combined.json "$TMP_DIR/js"
	pnpm --filter=./.github/files/coverage-munger/ exec nyc report --no-exclude-after-remap --report-dir="$TMP_DIR" --temp-dir="$TMP_DIR/js" --reporter=json-summary
	jq -r 'to_entries[] | select( .key != "total" ) | [ .key, .value.lines.total, .value.lines.covered ] | @tsv' "$TMP_DIR/coverage-summary.json" > "$TMP_DIR/js-summary.tsv"
	echo '::endgroup::'
else
	echo "No JS coverage files found!"
	touch "$TMP_DIR/js-summary.tsv"
fi

echo "::group::Combining coverage summaries"
sort "$TMP_DIR/php-summary.tsv" "$TMP_DIR/js-summary.tsv" > artifacts/summary.tsv
echo '::endgroup::'
