#!/bin/bash

set -eo pipefail

array=()
while IFS=  read -r -d $'\0'; do
    array+=("$REPLY")
done < <(find projects -name "*.php" -type f -print0)

for file in "${array[@]}"; do
	echo "Checking $file"
  vendor/bin/phpcs -q -s --standard="$1" --sniffs="$2" --ignore="*/vendor/*,*/wordpress/*" "$file" >> ./tools/phpcs.log || true
done

echo "Files with errors and warnings logged to /tools/phpcs.log"

