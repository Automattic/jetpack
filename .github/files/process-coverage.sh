#!/bin/bash

set -eo pipefail

BASE="$(pwd)"

[[ -d coverage ]] && find coverage -type d -empty -delete
if [[ ! -d coverage ]]; then
	echo 'No coverage was generated.'
	exit 0
fi

echo '::group::Copy coverage into artifacts'
tar --owner=0 --group=0 --xz -cvvf artifacts/coverage.tar.xz coverage
echo '::endgroup::'

for SLUG in $(echo $CHANGED | jq -r 'keys[]'); do
if [[ -d "./coverage/$SLUG" ]]
FLAG=$(echo $SLUG | tr / _)
then
		echo "::group::Send $SLUG coverage to codecov.io"
		bash <(curl -s https://codecov.io/bash) -s ./coverage/$SLUG -F $FLAG || echo "Codecov failed to upload $FLAG"
		echo '::endgroup::'
fi
done
