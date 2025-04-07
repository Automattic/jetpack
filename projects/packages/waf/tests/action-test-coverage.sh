#!/bin/bash

set -veo pipefail

EXIT=0
php -dpcov.directory=. ./vendor/bin/phpunit-select-config tests/php/integration/phpunit.#.xml.dist --coverage-php "$COVERAGE_DIR/integration/php.cov" || EXIT=1
php -dpcov.directory=. ./vendor/bin/phpunit-select-config tests/php/unit/phpunit.#.xml.dist --coverage-php "$COVERAGE_DIR/unit/php.cov" || EXIT=1

exit $EXIT
