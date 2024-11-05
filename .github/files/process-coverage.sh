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
