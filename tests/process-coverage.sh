#!/bin/bash

./cc-test-reporter format-coverage -t clover -o coverage/codeclimate.backend.json coverage/clover.xml # Format backend coverage
./cc-test-reporter format-coverage -t lcov -o coverage/codeclimate.frontend.json coverage/lcov.info  # Format frontend coverage

export PACKAGES='./coverage/packages/*-clover.xml'
for PACKAGE in $PACKAGES
do
	FILENAME=$(basename -- "$PACKAGE")
	NAME="${FILENAME%-*.*}"
	echo $NAME
	echo ./cc-test-reporter format-coverage -t clover -o coverage/codeclimate.$NAME.json coverage/packages/$FILENAME # Format backend coverage
done

echo ./cc-test-reporter sum-coverage coverage/codeclimate.*.json -p $(ls -1q coverage/codeclimate.*.json | wc -l) # Sum both coverage parts into coverage/codeclimate.json
./cc-test-reporter sum-coverage coverage/codeclimate.*.json -p $(ls -1q coverage/codeclimate.*.json | wc -l) # Sum both coverage parts into coverage/codeclimate.json


if [[ "$TRAVIS_TEST_RESULT" == 0 ]]; then
	./cc-test-reporter upload-coverage;
fi  # Upload coverage/codeclimate.json
