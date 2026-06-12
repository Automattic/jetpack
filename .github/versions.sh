#!/usr/bin/env bash

# We can't use `export`, because this file is also parsed by tools/cli (whose `envfile` dependency doesn't understand `export`).
# shellcheck disable=SC2034

# Versions of tools to use in CI.
PHP_VERSION=8.4
COMPOSER_VERSION=2.10.0
NODE_VERSION=24.15.0
PNPM_VERSION=11.5.2

# Other useful version numbers.
MIN_PHP_VERSION=7.2
MAX_PHP_VERSION=8.5
