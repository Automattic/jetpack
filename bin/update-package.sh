#!/bin/bash

git_setup()
{
  cat <<- EOF > "$HOME/.netrc"
		machine github.com
			login matticbot
			password $GITHUB_TOKEN
		machine api.github.com
			login matticbot
			password $GITHUB_TOKEN
EOF
  chmod 600 "$HOME/.netrc"

  git config --global user.email "matticbot@users.noreply.github.com"
  git config --global user.name "matticbot"
}

# Halt on error
set -e

git_setup

BASE=$(pwd)
MONOREPO_COMMIT_MESSAGE=$(git show -s --format=%B $GITHUB_SHA)
COMMIT_MESSAGE=$( echo "${MONOREPO_COMMIT_MESSAGE}\n\nCommitted via a GitHub action: https://github.com/automattic/jetpack/runs/${GITHUB_RUN_ID}" )
COMMIT_ORIGINAL_AUTHOR="${GITHUB_ACTOR} <${GITHUB_ACTOR}@users.noreply.github.com>"

echo "Cloning folders in /packages and pushing to Automattic package repos"

# sync to read-only clones
for package in packages/*; do
	[ -d "$package" ] || continue # We are only interested in directories (i.e. packages)

	cd $BASE

	# Only keep the package's name
	NAME=${package##*/}

	echo " Name: $NAME"

	CLONE_DIR="__${NAME}__clone__"
	echo "  Clone dir: $CLONE_DIR"

	# Check if a remote exists for that package.
	$( git ls-remote --exit-code -h "https://github.com/automattic/jetpack-${NAME}.git" >/dev/null 2>&1 ) || continue
	echo "  ${NAME} exists. Let's clone it."

	# clone, delete files in the clone, and copy (new) files over
	# this handles file deletions, additions, and changes seamlessly
	git clone --depth 1 https://$API_TOKEN_GITHUB@github.com/automattic/jetpack-$NAME.git $CLONE_DIR

	echo "  Cloning of ${NAME} completed"

	cd $CLONE_DIR

	find . | grep -v ".git" | grep -v "^\.*$" | xargs rm -rf # delete all files (to handle deletions in monorepo)

	echo "  Copying from ${BASE}/packages/${NAME}/."

	cp -r $BASE/packages/$NAME/. .

	# Before we commit any changes, ensure that the repo has the basics we need for any package.
	if [ ! -f "composer.json" ]; then
		echo "  Those changes remove essential parts of the package. They will not be committed."
	# Commit if there is any change that could be committed
	elif [ -n "$(git status --porcelain)" ]; then

		echo  "  Committing $NAME to $NAME's mirror repository"
		git add -A
		git commit --author="${COMMIT_ORIGINAL_AUTHOR}" -m "${COMMIT_MESSAGE}"
		git push origin master
		echo  "  Completed $NAME"
	else
		echo "  No changes, skipping $NAME"
	fi

	cd $BASE
done
