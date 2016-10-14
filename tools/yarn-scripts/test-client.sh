#!/bin/bash

# This file is meant to be run as a yarn script
# Run `yarn run test-client` from the root Jetpack folder to execute it

NODE_ENV=test NODE_PATH=tests:_inc/client:node_modules/@automattic/dops-components/client tests/runner.js

