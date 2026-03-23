#!/usr/bin/env bash

# Skip tests on PHP 8.4.19 due to inconsistent Codeception timeouts on that version.
# @todo: remove this when PHP 8.4 has a higher patch version: p1773618372849869-slack-C034JEXD1RD
if php -r 'exit(PHP_VERSION === "8.4.19" ? 0 : 1);'; then
	echo "Skipping Codeception tests on PHP 8.4.19 (current: $(php -r 'echo PHP_VERSION;'))"
	exit 3
fi
