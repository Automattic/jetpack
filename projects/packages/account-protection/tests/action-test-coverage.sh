#!/bin/bash

set -veo pipefail

EXIT=0
php -dpcov.directory=. ./vendor/bin/phpunit --coverage-php "$COVERAGE_DIR/integration/php.cov" --configuration tests/php/integration/phpunit.xml.dist || EXIT=1
php -dpcov.directory=. ./vendor/bin/phpunit --coverage-php "$COVERAGE_DIR/unit/php.cov" --configuration tests/php/unit/phpunit.xml.dist || EXIT=1

exit $EXIT
