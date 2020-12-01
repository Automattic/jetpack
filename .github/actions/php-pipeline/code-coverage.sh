#!/bin/bash

./includes.sh

# Init code climate
curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter
chmod +x ./cc-test-reporter
./cc-test-reporter before-build


export PHPUNIT=$(which phpunit)
export BACKEND_CMD="phpdbg -qrr $PHPUNIT --coverage-clover $GITHUB_WORKSPACE/coverage/backend/clover.xml"
export LEGACY_SYNC_CMD="phpdbg -qrr $PHPUNIT --group=legacy-full-sync --coverage-clover $GITHUB_WORKSPACE/coverage/legacy-sync/clover.xml"
export MULTISITE_CMD="phpdbg -qrr $PHPUNIT -c tests/php.multisite.xml --coverage-clover $GITHUB_WORKSPACE/coverage/multisite/clover.xml"

print_build_info


cd "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/jetpack"


run_cmd $BACKEND_CMD
export LEGACY_FULL_SYNC=1
run_cmd $LEGACY_SYNC_CMD
unset LEGACY_FULL_SYNC
export WP_MULTISITE=1
run_cmd $MULTISITE_CMD
unset WP_MULTISITE


echo "Running code coverage for packages:"
export PACKAGES='./packages/**/tests/php'
for PACKAGE in $PACKAGES
do
	if [ -d "$PACKAGE" ]; then
		cd "$PACKAGE/../.."
		export NAME=$(basename $(pwd))
		composer install
		export PACKAGE_CMD="phpdbg -d memory_limit=2048M -d max_execution_time=900 -qrr ./vendor/bin/phpunit --coverage-clover $GITHUB_WORKSPACE/coverage/package-$NAME/clover.xml"

		echo "Running \`$PACKAGE_CMD\` for package \`$NAME\` "
		run_cmd $PACKAGE_CMD
		cd ../..
	fi
done

exit 0
