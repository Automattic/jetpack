#!/bin/bash
# This script is ran as part of the `UpdateJetpackStaging` TeamCity build.
# It triggers an E2E test run against pre-defined atomic sites that have been updated with the newest Jetpack build.

if [[ -z "$SIGNATURE_KEY" || -z "$TRIGGER_URL" ]]; then
  echo "Missing required ENV variables: both 'SIGNATURE_KEY' and 'TRIGGER_URL' are required. Aborting."
  exit 1
fi

echo "Starting atomic deploy E2E tests..."

REQUEST_SIGNATURE=$(echo -n | openssl mac -digest sha256 -macopt "key:$SIGNATURE_KEY" HMAC)
curl --fail-with-body -s -X POST -H "X-Jetpack-Atomic-Deploy-E2E-Signature: ${REQUEST_SIGNATURE,,}" "$TRIGGER_URL"

if [[ $? -eq 0 ]]; then
  echo -e "\nAtomic deploy E2E tests started successfully."
else
  echo -e "\nAtomic deploy E2E tests failed to start."
  exit 1
fi
