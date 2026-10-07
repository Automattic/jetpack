#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

[[ -d coverage ]] && find coverage -type d -empty -delete
if [[ ! -d coverage ]]; then
	echo 'No coverage was generated.'
	exit 0
fi

echo '::group::Copy coverage into artifacts'
tar --owner=0 --group=0 --xz -cvvf "artifacts/coverage-$ARTIFACT.tar.xz" coverage
echo '::endgroup::'

TMP_DIR=$( mktemp -d )
trap 'rm -rf "$TMP_DIR"' exit

# Name the summary per artifact so downloading with `merge-multiple` doesn't clobber summaries from other jobs. The publish job merges them.
SUMMARY="artifacts/summary-$ARTIFACT.tsv"

TMP=$( find "$PWD/coverage" -name '*.cov' )
if [[ -n "$TMP" ]]; then
	echo "::group::Combining PHP coverage"
	composer --working-dir="$BASE" update
	"$BASE"/vendor/bin/phpcov merge --php artifacts/php-combined.cov coverage
	perl -i -pwe 'BEGIN { $prefix = shift; $prefix=~s!/*$!/!; $re = qr/\Q$prefix\E/; $l = length( $prefix ); } s!s:(\d+):"$re! sprintf( qq(s:%d:"), $1 - $l ) !ge' "$GITHUB_WORKSPACE" artifacts/php-combined.cov
	echo '::endgroup::'

	echo "::group::Creating PHP coverage summary"
	"$BASE"/extract-php-summary-data.php artifacts/php-combined.cov > "$SUMMARY"
	echo '::endgroup::'
fi

TMP=$( find "$PWD/coverage" -name '*.json' )
if [[ -n "$TMP" ]]; then
	JS_COMBINED="artifacts/js-combined-$ARTIFACT.json"

	echo "::group::Combining JS coverage"

	# nyc needs all input files in a single directory, not in subdirs.
	mkdir "$TMP_DIR/jsraw"
	IDX=10000
	while IFS= read -r F; do
		cp "$F" "$TMP_DIR/jsraw/$(( IDX++ )).json"
	done < <( find "$PWD/coverage" -name '*.json' )

	pnpm --filter=./.github/files/coverage-munger/ exec nyc merge "$TMP_DIR/jsraw" "$PWD/$JS_COMBINED"
	perl -i -pwe 'BEGIN { $prefix = shift; $prefix=~s!/*$!/!; $re = qr/\Q$prefix\E/; } s!"$re!"!g' "$GITHUB_WORKSPACE" "$JS_COMBINED"
	echo '::endgroup::'

	echo "::group::Creating JS coverage summary"
	mkdir "$TMP_DIR/js"
	cp -v "$JS_COMBINED" "$TMP_DIR/js"
	pnpm --filter=./.github/files/coverage-munger/ exec nyc report --no-exclude-after-remap --report-dir="$TMP_DIR" --temp-dir="$TMP_DIR/js" --reporter=json-summary
	jq -r 'to_entries[] | select( .key != "total" ) | [ .key, .value.lines.total, .value.lines.covered ] | @tsv' "$TMP_DIR/coverage-summary.json" > "$SUMMARY"
	echo '::endgroup::'
fi
