#!/bin/bash

git_setup()
{
  cat <<- EOF > "$HOME/.netrc"
		machine github.com
			login $GITHUB_ACTOR
			password $GITHUB_TOKEN
		machine api.github.com
			login $GITHUB_ACTOR
			password $GITHUB_TOKEN
EOF
  chmod 600 "$HOME/.netrc"

  git config --global user.email "$GITHUB_ACTOR@users.noreply.github.com"
  git config --global user.name "$GITHUB_ACTOR"
}

# Halt on error
set -e

git_setup

BASE=$(pwd)
COMMIT_MESSAGE=$(git show -s --format=%B $GITHUB_SHA)

git config --global user.email "$GITHUB_ACTOR@users.noreply.github.com"
git config --global user.name "$GITHUB_ACTOR"

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

	# Commit if there is anything to
	if [ -n "$(git status --porcelain)" ]; then
		echo  "  Committing $NAME to $NAME's mirror repository"
		git add -A
		git commit -m "${COMMIT_MESSAGE}"
		git push origin master
		echo  "  Completed $NAME"
		else
		echo "  No changes, skipping $NAME"
	fi

	cd $BASE
done
