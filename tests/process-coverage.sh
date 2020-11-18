#!/bin/bash

# Format backend coverage
./cc-test-reporter format-coverage --prefix /tmp/wordpress-latest/src/wp-content/plugins/jetpack -t clover -o coverage/codeclimate.backend.json coverage/backend-clover.xml
./cc-test-reporter format-coverage --prefix /tmp/wordpress-latest/src/wp-content/plugins/jetpack -t clover -o coverage/codeclimate.legacysync.json coverage/legacy-sync-clover.xml
./cc-test-reporter format-coverage --prefix /tmp/wordpress-latest/src/wp-content/plugins/jetpack -t clover -o coverage/codeclimate.multisite.json coverage/multisite-clover.xml

# Format frontend coverage
./cc-test-reporter format-coverage -t lcov -o coverage/codeclimate.adminpage.json coverage/adminpage/lcov.info
./cc-test-reporter format-coverage -t lcov -o coverage/codeclimate.extensions.json coverage/extensions/lcov.info

# Format packages coverage
export PACKAGES='./coverage/packages/*-clover.xml'
for PACKAGE in $PACKAGES
do
	FILENAME=$(basename -- "$PACKAGE")
	NAME="${FILENAME%-*.*}"
	./cc-test-reporter format-coverage -t clover -o coverage/codeclimate.$NAME.json coverage/packages/$FILENAME
done

# Sum all coverage parts into a single coverage/codeclimate.json
echo ./cc-test-reporter sum-coverage coverage/codeclimate.*.json -p $(ls -1q coverage/codeclimate.*.json | wc -l)
./cc-test-reporter sum-coverage coverage/codeclimate.*.json -p $(ls -1q coverage/codeclimate.*.json | wc -l)

# Upload coverage/codeclimate.json
if [[ "$TRAVIS_TEST_RESULT" == 0 ]]; then
	./cc-test-reporter upload-coverage;
fi
