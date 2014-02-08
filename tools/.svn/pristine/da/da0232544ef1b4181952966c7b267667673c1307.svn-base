#!/bin/bash

# add-textdomain.sh DIRECTORY

DIRECTORY=${1?"Usage: $0 DIRECTORY"}

while IFS= read -r -d '' file; do
	php $(dirname $(readlink -f $0))/wordpress-i18n/add-textdomain.php -i jetpack "$file"
done < <(find $DIRECTORY -type f -name '*.php' \! -path '*.svn*' -print0)
