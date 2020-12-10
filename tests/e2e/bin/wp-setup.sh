#!/bin/bash

#####
# This script is designed to be running inside the WP container
# it is basically a hacky way to insert arbitrary PHP code into wp-config without messing with bash escaping etc.
# Also, it creates a debug log file

touch wp-content/debug.log
chown www-data:www-data wp-content/debug.log

sed -i "/\/\* That's all, stop editing! Happy publishing. \*\//i\
define( 'E2E_REQUEST_URL', ( ! empty( \\\$_SERVER['HTTPS'] ) ? 'https://' : 'http://' ) . ( ! empty( \\\$_SERVER['HTTP_HOST'] ) ? \\\$_SERVER['HTTP_HOST'] : 'localhost' ) );\n\
define( 'WP_SITEURL', E2E_REQUEST_URL );\n\
define( 'WP_HOME', E2E_REQUEST_URL );\n\
" wp-config.php
