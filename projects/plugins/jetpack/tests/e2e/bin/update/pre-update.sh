#!/bin/bash

set -e

# This should run inside the Docker container
# ===========================================

printf "\nCapture Jetpack status before update\n"
mkdir -p update-test-output
wp --allow-root jetpack status full > /var/www/html/wp-content/uploads/jetpack-status-before-update
