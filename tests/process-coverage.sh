#!/bin/bash

./cc-test-reporter format-coverage -t clover -o coverage/codeclimate.backend.json coverage/backend-clover.xml # Format backend coverage
./cc-test-reporter format-coverage -t lcov -o coverage/codeclimate.adminpage.json coverage/adminpage/lcov.info  # Format frontend coverage
./cc-test-reporter format-coverage -t lcov -o coverage/codeclimate.extensions.json coverage/extensions/lcov.info  # Format frontend coverage


ls -la coverage/packages
ls -la coverage
ls -la .
export PACKAGES='./coverage/packages/*-clover.xml'
for PACKAGE in $PACKAGES
do
	FILENAME=$(basename -- "$PACKAGE")
	NAME="${FILENAME%-*.*}"
	# Format packages coverage
	./cc-test-reporter format-coverage -t clover -o coverage/codeclimate.$NAME.json coverage/packages/$FILENAME
done

# Sum both coverage parts into coverage/codeclimate.json
./cc-test-reporter sum-coverage coverage/codeclimate.*.json -p $(ls -1q coverage/codeclimate.*.json | wc -l)

# Upload coverage/codeclimate.json
if [[ "$TRAVIS_TEST_RESULT" == 0 ]]; then
	./cc-test-reporter upload-coverage;
fi
