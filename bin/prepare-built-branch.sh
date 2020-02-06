#!/bin/bash

# This creates a new .gitignore file based on master, but removes the items we need for release builds
function create_release_gitignore {
	# Copy .gitignore to temp file
	mv .gitignore .gitignore-tmp

	# Create empty .gitignore
	touch .gitignore

	# Add things to the new .gitignore file, stopping at the things we want to keep.
	while IFS='' read -r line || [[ -n "$line" ]]; do
		if [[ "$line" == "## Things we will need in release branches" ]]; then
			break
		fi
		echo "$line" >> .gitignore
	done < ".gitignore-tmp"

	# Add custom stuff to .gitignore release
	echo "/_inc/client" >> .gitignore
	echo "/docker/" >> .gitignore

	# Needs to stay in sync with .svnignore and `create_new_release_branches` in this file.
	echo "__snapshots__/" >> .gitignore
	echo "/extensions/**/*.css" >> .gitignore
	echo "/extensions/**/*.gif" >> .gitignore
	echo "/extensions/**/*.jpeg" >> .gitignore
	echo "/extensions/**/*.jpg" >> .gitignore
	echo "/extensions/**/*.js" >> .gitignore
	echo "/extensions/**/*.json" >> .gitignore
	echo "/extensions/**/*.jsx" >> .gitignore
	echo "/extensions/**/*.md" >> .gitignore
	echo "/extensions/**/*.png" >> .gitignore
	echo "/extensions/**/*.sass" >> .gitignore
	echo "/extensions/**/*.scss" >> .gitignore
	echo "/extensions/**/*.svg" >> .gitignore

	# Remove old .gitignore
	rm .gitignore-tmp
}

#create_release_gitignore

# check .svnignore and purge
SVNIGNORE="$(pwd)/.svnignore"
for file in $( cat "$SVNIGNORE" 2>/dev/null ); do
	# We want to commit changes to to-test.md as well as the testing tips.
	if [[ $file == "to-test.md" || $file == "docs/testing/testing-tips.md" || $file =~ ^.git* ]]; then
		continue;
	fi
	rm -rf $file
done