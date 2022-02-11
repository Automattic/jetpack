#!/bin/bash

set -e

# This should run inside the Docker container with the WordPress instance
# =======================================================================

printf "\nCapture Jetpack status after update\n"
wp --allow-root jetpack status full > /var/www/html/wp-content/uploads/jetpack-status-after-update
cat /var/www/html/wp-content/uploads/jetpack-status-after-update

printf "\nCapture Jetpack status diff\n"
diff -y --suppress-common-lines /var/www/html/wp-content/uploads/jetpack-status-before-update /var/www/html/wp-content/uploads/jetpack-status-after-update > /var/www/html/wp-content/uploads/jetpack-status-diff || true
cat /var/www/html/wp-content/uploads/jetpack-status-diff
