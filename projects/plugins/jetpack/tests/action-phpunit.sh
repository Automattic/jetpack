#!/usr/bin/env bash

set -eo pipefail

. tests/maybe-download-phpunit.sh
exec $phpunit "$@"
