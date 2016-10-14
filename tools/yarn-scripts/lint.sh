#!/bin/bash

# This file is meant to be run as a yarn script
# Run `yarn run lint` from the root Jetpack folder to execute it

eslint _inc/client -c .eslintrc
