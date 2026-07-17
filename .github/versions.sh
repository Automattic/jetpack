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

# Minimum supported WordPress version. Keep in sync with the "Requires at least" headers in the plugins.
# This is deliberately hard-coded rather than detected: near a WP release there's a window where we've
# dropped support for the old version but WP hasn't actually released the new one yet.
MIN_WP_VERSION=6.9
