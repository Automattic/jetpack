#!/bin/bash

set -eo pipefail

if [[ -z "$CI" ]]; then
	echo "This script is only for use in the CI environment. Sorry."
	exit 1
fi

: "${WORDPRESS_DIR:?WORDPRESS_DIR needs to be set and non-empty.}"

# Point output dir to the CI artifacts dir.
if [[ -n "$ARTIFACTS_DIR" ]]; then
	rm -rf tests/codeception/_output
	ln -s "$ARTIFACTS_DIR" tests/codeception/_output
fi

# Setup database. Even though tests/codeception/acceptance.suite.yml contains commands to create it, it chokes before it gets to run them without this.
mysql -e "DROP DATABASE IF EXISTS jpcrm_testing; CREATE DATABASE jpcrm_testing;"

# Setup config.
cp tests/codeception/acceptance.suite.dist.yml tests/codeception/acceptance.suite.yml
sed -i 's/some_db_user/root/g' tests/codeception/acceptance.suite.yml
sed -i 's/some_db_pass/root/g' tests/codeception/acceptance.suite.yml
sed -i 's/host=localhost/host=127.0.0.1/g' tests/codeception/acceptance.suite.yml
sed -i 's!/path/to/test/file/must-overwrite-it-in-acceptance.suite.yml!'"$WORDPRESS_DIR"'!g' tests/codeception/acceptance.suite.yml

# Setup WordPress runtime config.
cp "$WORDPRESS_DIR/wp-config-sample.php" "$WORDPRESS_DIR/wp-config.php"
sed -i 's/database_name_here/jpcrm_testing/g' "$WORDPRESS_DIR/wp-config.php"
sed -i 's/username_here/root/g' "$WORDPRESS_DIR/wp-config.php"
sed -i 's/password_here/root/g' "$WORDPRESS_DIR/wp-config.php"
sed -i 's/localhost/127.0.0.1/g' "$WORDPRESS_DIR/wp-config.php"
sed -i '/Add any custom values between this line and the "stop editing" line./a define("DISABLE_WP_CRON", true);\ndefine("WP_AUTO_UPDATE_CORE", false);' "$WORDPRESS_DIR/wp-config.php"

# Build and run tests
composer build-tests
composer tests
