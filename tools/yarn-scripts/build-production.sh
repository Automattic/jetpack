#!/bin/bash

# This file is meant to be run as a yarn script
# Run `yarn run build-production' from the root Jetpack folder to execute it

yarn run clean && /
yarn run build && /
yarn run build-languages && /
gulp languages:extract && /
NODE_ENV=production BABEL_ENV=production yarn run build

