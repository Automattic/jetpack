#!/bin/bash

set -eo pipefail

EXIT=0

[[ -d coverage ]] && find coverage -type d -empty -delete
if [[ ! -d coverage ]]; then
	echo 'No coverage was generated.'
	exit $EXIT
fi

echo '::group::Copy coverage into artifacts'
tar --owner=0 --group=0 --xz -cvvf artifacts/coverage.tar.xz coverage
echo '::endgroup::'

curl --fail --no-progress-meter -O https://uploader.codecov.io/latest/linux/codecov
chmod +x codecov

for SLUG in $(jq -r 'keys[]' <<<"$CHANGED"); do
	FLAG=$(tr / _ <<<"$SLUG")
	if [[ -d "./coverage/$SLUG" ]]; then
		echo "::group::Send $SLUG coverage to codecov.io"
		if ./codecov -Z -s "./coverage/$SLUG" -F "$FLAG"; then
			echo "::endgroup::"
		else
			echo "::endgroup::"
			echo "::error::Codecov failed to upload $SLUG"
			EXIT=1
		fi
	fi
done
exit $EXIT
