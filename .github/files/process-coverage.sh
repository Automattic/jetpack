#!/bin/bash

set -eo pipefail

[[ -d coverage ]] && find coverage -type d -empty -delete
[[ -d coverage ]] || exit 0

## Codecov.io
bash <(curl -s https://codecov.io/bash) -s ./coverage || echo 'Codecov failed to upload'

## codeclimate.com

# Process all the files.
BASE="$(pwd)"
FILES=()
while IFS= read -r FILE; do
	TMP="${FILE#coverage/}"
	TYPE="${TMP%%/*}"
	TMP="${TMP#$TYPE/}"
	SLUG="${TYPE}/${TMP%%/*}"

	if [[ "$TYPE" == "plugins" ]]; then
		PREFIX="/tmp/wordpress-${WP_BRANCH}/src/wp-content/$SLUG"
	else
		PREFIX="$BASE/projects/$SLUG"
	fi

	case "$FILE" in
		*clover.xml)
			echo "Found clover coverage file $FILE"
			cd "$BASE/projects/$SLUG"
			"$BASE/cc-test-reporter" format-coverage --prefix "$PREFIX" --add-prefix "projects/$SLUG" -t clover -o "$BASE/$FILE.json" "$BASE/$FILE"
			FILES+=( "$FILE.json" )
			;;
		*lcov.info)
			echo "Found lcov coverage file $FILE"
			cd "$BASE/projects/$SLUG"
			"$BASE/cc-test-reporter" format-coverage --prefix "$PREFIX" --add-prefix "projects/$SLUG" -t lcov -o "$BASE/$FILE.json" "$BASE/$FILE"
			FILES+=( "$FILE.json" )
			;;
		*)
			echo "Ignoring unrecognized coverage file $FILE"
			;;
	esac
	cd "$BASE"
done < <(find coverage -type f)

if [[ "${#FILES[@]}" -gt 0 ]]; then
	# Sum all coverage parts into a single coverage/codeclimate.json
	./cc-test-reporter sum-coverage -p "${#FILES[@]}" "${FILES[@]}"

	# Upload coverage/codeclimate.json
	./cc-test-reporter upload-coverage
fi
