#!/usr/bin/env bash

# We can't use `export`, because this file is also parsed by tools/cli (whose `envfile` dependency doesn't understand `export`).
# shellcheck disable=SC2034

# Versions of tools to use in CI.
PHP_VERSION=8.4
COMPOSER_VERSION=2.10.0
NODE_VERSION=24.15.0
PNPM_VERSION=11.5.2

# Other useful version numbers.
MIN_PHP_VERSION=7.4
MAX_PHP_VERSION=8.5

# Latest point release of each PHP branch from MIN_PHP_VERSION to MAX_PHP_VERSION that the local Docker container may run when `jetpack docker jt-up` opens a public tunnel.
# A container on a listed branch needs that release or newer; a branch newer than all of them passes.
MIN_PHP_VERSION_TUNNEL="7.4.33 8.0.30 8.1.34 8.2.34 8.3.35 8.4.26 8.5.11"

# Minimum supported WordPress version. Keep in sync with the "Requires at least" headers in the plugins.
# This is deliberately hard-coded rather than detected: near a WP release there's a window where we've
# dropped support for the old version but WP hasn't actually released the new one yet.
MIN_WP_VERSION=7.0
