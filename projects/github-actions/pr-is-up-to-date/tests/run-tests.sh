#!/bin/bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

TMPDIR="${TMPDIR:-/tmp}"
DIR=$(mktemp -d "${TMPDIR%/}/pr-is-up-to-date.XXXXXXXX")
trap 'rm -rf $DIR' EXIT

cd "$BASE/tests"
EXIT=0
for TEST in test-*.sh; do
	DESC="$(sed -E 's/^test-(.*)\.sh$/\1/; s/-/ /g' <<<"$TEST")"
	printf " -- Running test %s..." "$DESC"
	mkdir "$DIR/test"
	if TESTDIR="$DIR/test" "$BASE/tests/$TEST" &>"$DIR/out.txt"; then
		printf "\r\e[K ✅ \e[32mTest %s passed!\e[0m\n" "$DESC"
	else
		printf "\r\e[K ❌ \e[31mTest %s failed!\e[0m\n\n" "$DESC"
		sed 's/^/      /' < "$DIR/out.txt"
		printf "\n\n"
		EXIT=1
	fi
	rm -rf "$DIR/test" "$DIR/out.txt"
done

exit $EXIT
