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

echo "Cloning folders in projects/packages and pushing to Automattic package repos"

# sync to read-only clones
for package in projects/packages/*; do
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

	# check if composer.json exists
	COMPOSER_JSON_EXISTED=false
	if [ -f "composer.json" ]; then
		COMPOSER_JSON_EXISTED=true
	fi

	find . | grep -v ".git" | grep -v "^\.*$" | xargs rm -rf # delete all files (to handle deletions in monorepo)

	echo "  Copying from ${BASE}/projects/packages/${NAME}/."

	cp -r $BASE/projects/packages/$NAME/. .

	# Before we commit any changes, ensure that the repo has the basics we need for any package.
	if $COMPOSER_JSON_EXISTED && [ ! -f "composer.json" ]; then
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

echo "Cloning folders in projects/plugins and pushing to Automattic package repos"

# sync to read-only clones
for plugin in projects/plugins/*; do
	[ -d "$plugin" ] || continue # We are only interested in directories (i.e. plugins)

	cd $BASE

	# Only keep the plugin's name
	NAME=${plugin##*/}

	echo " Name: $NAME"

	CLONE_DIR="__${NAME}__clone__"
	echo "  Clone dir: $CLONE_DIR"

	if $NAME == 'jetpack'; then
		GIT_SLUG='jetpack-production'
	else
		GIT_SLUG="jetpack-${NAME}";
	fi
	# Check if a remote exists for that package.
	$( git ls-remote --exit-code -h "https://github.com/automattic/${GIT_SLUG}.git" >/dev/null 2>&1 ) || continue
	echo "  ${NAME} exists. Let's clone it."

	# clone, delete files in the clone, and copy (new) files over
	# this handles file deletions, additions, and changes seamlessly
	git clone --depth 1 https://$API_TOKEN_GITHUB@github.com/automattic/$GIT_SLUG.git $CLONE_DIR

	echo "  Cloning of ${NAME} completed"

	cd $CLONE_DIR

	find . | grep -v ".git" | grep -v "^\.*$" | xargs rm -rf # delete all files (to handle deletions in monorepo)

	echo "  Copying from ${BASE}/projects/plugins/${NAME}/."

	cp -r $BASE/projects/plugins/$NAME/. .

	if [ -n "$(git status --porcelain)" ]; then

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
