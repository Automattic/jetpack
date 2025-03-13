#!/usr/bin/env bash

set -eo pipefail

exec phpunit-select-config phpunit.#.xml.dist "$@"
