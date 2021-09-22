#!/usr/bin/env bash

set -eo pipefail

. tests/maybe-downgrade-phpunit.sh
exec phpunit "$@"
