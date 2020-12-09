#!/bin/bash

# Format backend coverage
./cc-test-reporter format-coverage --prefix /tmp/wordpress-latest/src/wp-content/plugins/jetpack -t clover -o coverage/codeclimate.backend.json coverage/backend/clover.xml
./cc-test-reporter format-coverage --prefix /tmp/wordpress-latest/src/wp-content/plugins/jetpack -t clover -o coverage/codeclimate.legacysync.json coverage/legacy-sync/clover.xml
./cc-test-reporter format-coverage --prefix /tmp/wordpress-latest/src/wp-content/plugins/jetpack -t clover -o coverage/codeclimate.multisite.json coverage/multisite/clover.xml

# Format frontend coverage
./cc-test-reporter format-coverage -t lcov -o coverage/codeclimate.adminpage.json coverage/adminpage/lcov.info
./cc-test-reporter format-coverage -t lcov -o coverage/codeclimate.extensions.json coverage/extensions/lcov.info

# Format packages coverage
export PACKAGES='./coverage/package-*/clover.xml'
for PACKAGE in $PACKAGES
do
	NAME=$(basename -- $(dirname $PACKAGE))
	./cc-test-reporter format-coverage --prefix /tmp/wordpress-latest/src/wp-content/plugins/jetpack -t clover -o coverage/codeclimate.$NAME.json $PACKAGE
done

# Sum all coverage parts into a single coverage/codeclimate.json
echo ./cc-test-reporter sum-coverage coverage/codeclimate.*.json -p $(ls -1q coverage/codeclimate.*.json | wc -l)
./cc-test-reporter sum-coverage coverage/codeclimate.*.json -p $(ls -1q coverage/codeclimate.*.json | wc -l)

# Upload coverage/codeclimate.json
./cc-test-reporter upload-coverage;
