#!/bin/sh
NEW_VERSION="$1"

# UPDATE jetpack.php header
[ $# -eq 0 ] && echo "Please provide a release number as first argument" && exit 1

sed -i .bak "s/* Version:.*/* Version: $NEW_VERSION/" jetpack.php
mv jetpack.php.bak /tmp


