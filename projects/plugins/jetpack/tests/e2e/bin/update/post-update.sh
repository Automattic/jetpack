#!/bin/bash

set -e

# This should run inside the Docker container with the WordPress instance
# =======================================================================

UPLOADS_DIR="/var/www/html/wp-content/uploads"
printf "\nCapture Jetpack status after update\n"
wp --allow-root jetpack status full > "$UPLOADS_DIR/jetpack-status-after-update"

printf "\nCapture Jetpack status diff\n"
diff -y --suppress-common-lines "$UPLOADS_DIR/jetpack-status-before-update" "$UPLOADS_DIR/jetpack-status-after-update" > "$UPLOADS_DIR/jetpack-status-diff" || true
