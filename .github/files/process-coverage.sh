#!/bin/bash

## Codecov.io
bash <(curl -s https://codecov.io/bash) -s ./coverage || echo 'Codecov failed to upload'

## codeclimate.com

# Process all the files.
FILES=()
while IFS= read -r FILE; do
	TMP="${FILE#coverage/}"
	TYPE="${TMP%%/*}"
	TMP="${TMP#$TYPE/}"
	SLUG="${TYPE}/${TMP%%/*}"

	if [[ "$TYPE" == "plugins" ]]; then
		PREFIX="/tmp/wordpress-${WP_BRANCH}/src/wp-content/$SLUG"
	else
		PREFIX="$PWD/projects/$SLUG"
	fi

	case "$FILE" in
		*clover.xml)
			echo "Found clover coverage file $FILE"
			./cc-test-reporter format-coverage --prefix "$PREFIX" --add-prefix "projects/$SLUG" -t clover -o "$FILE.json" "$FILE"
			FILES+=( "$FILE.json" )
			;;
		*lcov.info)
			echo "Found lcov coverage file $FILE"
			./cc-test-reporter format-coverage --prefix "$PREFIX" --add-prefix "projects/$SLUG" -t lcov -o "$FILE.json" "$FILE"
			FILES+=( "$FILE.json" )
			;;
		*)
			echo "Ignoring unrecognized coverage file $FILE"
			;;
	esac
done < <(find coverage -type f)

# Sum all coverage parts into a single coverage/codeclimate.json
./cc-test-reporter sum-coverage -p "${#FILES[@]}" "${FILES[@]}"

# Upload coverage/codeclimate.json
./cc-test-reporter upload-coverage
