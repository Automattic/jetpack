#!/bin/bash

set -eo pipefail

BASE="$(pwd)"

[[ -d coverage ]] && find coverage -type d -empty -delete
if [[ ! -d coverage ]]; then
	echo 'No coverage was generated.'
	exit 0
fi

echo '::group::Copy coverage into artifacts'
tar --owner=0 --group=0 --xz -cvvf artifacts/coverage.tar.xz coverage
echo '::endgroup::'

echo '::group::Send coverage to codecov.io'
bash <(curl -s https://codecov.io/bash) -s ./coverage || echo 'Codecov failed to upload'
echo '::endgroup::'

echo '::group::Send coverage to codeclimate.com'
# Process all the files.
FILES=()
while IFS= read -r FILE; do
	TMP="${FILE#coverage/}"
	TYPE="${TMP%%/*}"
	if [[ "$TYPE" == 'monorepo' ]]; then
		DIR="$BASE"
		PREFIX="$DIR"
		ADD_PREFIX=
	else
		TMP="${TMP#$TYPE/}"
		SLUG="${TYPE}/${TMP%%/*}"
		DIR="$BASE/projects/$SLUG"
		if [[ "$TYPE" == "plugins" ]]; then
			PREFIX="/tmp/wordpress-${WP_BRANCH}/src/wp-content/$SLUG"
		else
			PREFIX="$DIR"
		fi
		ADD_PREFIX="projects/$SLUG"
	fi

	cd "$DIR"
	case "$FILE" in
		*clover.xml)
			echo "Found clover coverage file $FILE"
			"$BASE/cc-test-reporter" format-coverage --prefix "$PREFIX" --add-prefix "$ADD_PREFIX" -t clover -o "$BASE/$FILE.json" "$BASE/$FILE"
			FILES+=( "$FILE.json" )
			;;
		*lcov.info)
			echo "Found lcov coverage file $FILE"
			"$BASE/cc-test-reporter" format-coverage --prefix "$PREFIX" --add-prefix "$ADD_PREFIX" -t lcov -o "$BASE/$FILE.json" "$BASE/$FILE"
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
else
	echo 'No coverage files were found.'
fi
echo '::endgroup::'
