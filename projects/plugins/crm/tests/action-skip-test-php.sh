#!/usr/bin/env bash

# Skip tests on PHP 8.4.21 and 8.5.6 due to inconsistent Codeception timeouts on those versions.
# @todo: remove this when PHP has higher patch versions: p1773618372849869-slack-C034JEXD1RD
# @todo: Consider bumping timeout limit to see if that makes a difference
if php -r 'exit(in_array(PHP_VERSION, ["8.4.21", "8.5.6"], true) ? 0 : 1);'; then
	echo "Skipping Codeception tests on PHP $(php -r 'echo PHP_VERSION;')"
	exit 3
fi
