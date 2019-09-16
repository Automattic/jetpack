#!/bin/bash

# check .svnignore
SVNIGNORE="$(pwd)/.svnignore"
for file in $( cat "$SVNIGNORE" 2>/dev/null ); do
	# We want to commit changes to to-test.md as well as the testing tips.
	if [[ $file == "to-test.md" || $file == "docs/testing/testing-tips.md" || $file =~ ^.git* ]]; then
		continue;
	fi
	rm -rf $file
done